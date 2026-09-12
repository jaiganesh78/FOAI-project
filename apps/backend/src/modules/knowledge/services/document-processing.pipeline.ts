import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  POLICY_DOCUMENT_REPOSITORY,
  POLICY_VERSION_REPOSITORY,
  POLICY_CHUNK_REPOSITORY,
  POLICY_FINGERPRINT_SERVICE,
  METADATA_EXTRACTION_SERVICE,
  POLICY_NORMALIZATION_SERVICE,
  CHUNK_GENERATION_SERVICE,
  KNOWLEDGE_QUALITY_SERVICE,
  CONNECTOR_FACTORY,
  PARSER_REGISTRY,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IPolicyDocumentRepository } from '../repositories/policy-document.repository.interface';
import { IPolicyVersionRepository } from '../repositories/policy-version.repository.interface';
import { IPolicyChunkRepository } from '../repositories/policy-chunk.repository.interface';
import { PolicyFingerprintService } from './policy-fingerprint.service';
import { MetadataExtractionService } from './metadata-extraction.service';
import { PolicyNormalizationService } from './policy-normalization.service';
import { ChunkGenerationService } from './chunk-generation.service';
import { KnowledgeQualityService } from './knowledge-quality.service';
import { KnowledgeIntegrityVerificationService } from './knowledge-integrity.service';
import { DocumentClassificationEngine } from './document-classification.engine';
import { ConnectorFactory } from '../connectors/connector.factory';
import { ParserRegistry } from '../parsers/parser.registry';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import { PolicyLifecycleStatus, DomainEventRegistry } from '@gpios/shared';
import { KnowledgeSource } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface PipelineExecutionMetrics {
  processingDurationMs: number;
  parsingDurationMs: number;
  normalizationDurationMs: number;
  chunkGenerationDurationMs: number;
  storageDurationMs: number;
  chunksCount: number;
  skippedDuplicate: boolean;
}

@Injectable()
export class DocumentProcessingPipeline {
  private readonly logger = new Logger(DocumentProcessingPipeline.name);

  constructor(
    @Inject(POLICY_DOCUMENT_REPOSITORY) private readonly documentRepository: IPolicyDocumentRepository,
    @Inject(POLICY_VERSION_REPOSITORY) private readonly versionRepository: IPolicyVersionRepository,
    @Inject(POLICY_CHUNK_REPOSITORY) private readonly chunkRepository: IPolicyChunkRepository,
    @Inject(POLICY_FINGERPRINT_SERVICE) private readonly fingerprintService: PolicyFingerprintService,
    @Inject(METADATA_EXTRACTION_SERVICE) private readonly metadataService: MetadataExtractionService,
    @Inject(POLICY_NORMALIZATION_SERVICE) private readonly normalizationService: PolicyNormalizationService,
    @Inject(CHUNK_GENERATION_SERVICE) private readonly chunkService: ChunkGenerationService,
    @Inject(KNOWLEDGE_QUALITY_SERVICE) private readonly qualityService: KnowledgeQualityService,
    @Inject(KnowledgeIntegrityVerificationService) private readonly integrityService: KnowledgeIntegrityVerificationService,
    @Inject(DocumentClassificationEngine) private readonly classificationEngine: DocumentClassificationEngine,
    @Inject(CONNECTOR_FACTORY) private readonly connectorFactory: ConnectorFactory,
    @Inject(PARSER_REGISTRY) private readonly parserRegistry: ParserRegistry,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async processSource(source: KnowledgeSource): Promise<PipelineExecutionMetrics> {
    const startTime = Date.now();
    this.logger.log(`Starting Document Processing Pipeline for source ${source.code}`);

    // Stage 1: Discovery & Download
    const connector = this.connectorFactory.getConnectorForSource(source);
    const fetchedDocs = await connector.fetchLatestDocuments(source);

    if (fetchedDocs.length === 0) {
      return {
        processingDurationMs: Date.now() - startTime,
        parsingDurationMs: 0,
        normalizationDurationMs: 0,
        chunkGenerationDurationMs: 0,
        storageDurationMs: 0,
        chunksCount: 0,
        skippedDuplicate: false,
      };
    }

    const fetched = fetchedDocs[0];

    // Stage 2: Fingerprinting & Duplicate Check
    const fingerprint = this.fingerprintService.generateFingerprint({
      rawContent: fetched.rawContent,
      title: fetched.title,
      publicationDate: fetched.publicationDate,
      sourceId: source.id,
    });

    const existingVersion = await this.versionRepository.findByFingerprint(fingerprint.hash);
    if (existingVersion) {
      this.logger.log(`Fingerprint ${fingerprint.hash} matches existing version. Ingestion skipped (Duplicate).`);
      return {
        processingDurationMs: Date.now() - startTime,
        parsingDurationMs: 0,
        normalizationDurationMs: 0,
        chunkGenerationDurationMs: 0,
        storageDurationMs: 0,
        chunksCount: 0,
        skippedDuplicate: true,
      };
    }

    // Stage 3: Parsing
    const parseStart = Date.now();
    const parser = this.parserRegistry.getParserForContentType(fetched.contentType);
    const parsedDoc = await parser.parse(fetched.rawContent);
    const parsingDurationMs = Date.now() - parseStart;

    // Stage 4: Classification & Document Record Creation
    const classification = this.classificationEngine.classify(parsedDoc.title, parsedDoc.rawText);

    let doc = await this.documentRepository.findByDocumentNumber(fetched.documentNumber);
    if (!doc) {
      doc = await this.documentRepository.createDocument({
        sourceId: source.id,
        documentNumber: fetched.documentNumber,
        title: parsedDoc.title,
        classification,
        status: PolicyLifecycleStatus.DOWNLOADED,
      });
    } else {
      await this.documentRepository.incrementVersion(doc.id);
    }

    // Stage 5: Metadata Extraction & Normalization
    const normStart = Date.now();
    const rawMetadata = this.metadataService.extractMetadata(parsedDoc.rawText, parsedDoc.title);
    const normalizedMetadata = this.normalizationService.normalize(rawMetadata);
    const normalizationDurationMs = Date.now() - normStart;

    // Stage 6: Chunk Generation with Stable IDs
    const chunkStart = Date.now();
    const generatedChunks = this.chunkService.generateChunks(parsedDoc);
    const chunkGenerationDurationMs = Date.now() - chunkStart;

    // Stage 7: Quality Evaluation & Integrity Verification
    const qualityReport = this.qualityService.evaluateQuality(generatedChunks, normalizedMetadata);
    const isVerified = this.integrityService.verifyIntegrity(generatedChunks, qualityReport);

    if (!isVerified) {
      this.logger.warn(`Document ${doc.documentNumber} failed integrity verification.`);
    }

    // Stage 8: Storage (Version & Chunks)
    const storageStart = Date.now();
    const newVersion = await this.versionRepository.createVersion({
      documentId: doc.id,
      versionNumber: doc.currentVersionNumber,
      fingerprintHash: fingerprint.hash,
      rawContentUrl: fetched.sourceUrl,
      effectiveDate: fetched.publicationDate || new Date(),
    });

    for (const chunkData of generatedChunks) {
      await this.chunkRepository.createChunk({
        documentId: doc.id,
        versionId: newVersion.id,
        stableChunkId: chunkData.stableChunkId,
        chunkIndex: chunkData.chunkIndex,
        sectionTitle: chunkData.sectionTitle,
        pageNumber: chunkData.pageNumber,
        paragraphIndex: chunkData.paragraphIndex,
        content: chunkData.content,
        checksum: chunkData.checksum,
        metadata: {
          ministry: normalizedMetadata.ministry,
          department: normalizedMetadata.department,
          schemeName: normalizedMetadata.schemeName,
          state: normalizedMetadata.state,
          district: normalizedMetadata.district,
          beneficiaryCategory: normalizedMetadata.beneficiaryCategory,
          normalizedAmount: normalizedMetadata.normalizedAmount,
          extractionConfidence: normalizedMetadata.extractionConfidence,
          extractionMethod: normalizedMetadata.extractionMethod,
          extractedBy: normalizedMetadata.extractedBy,
          sourceLocation: normalizedMetadata.sourceLocation,
        },
      });
    }

    // Stage 9: Lifecycle State Machine Transition -> ACTIVE
    await this.documentRepository.updateStatus(doc.id, PolicyLifecycleStatus.ACTIVE);
    const storageDurationMs = Date.now() - storageStart;

    // Stage 10: Event Publishing
    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Knowledge.DocumentProcessed,
      eventVersion: '1.0',
      aggregateId: doc.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        sourceId: source.id,
        versionNumber: newVersion.versionNumber,
        fingerprintHash: fingerprint.hash,
        chunkCount: generatedChunks.length,
        lifecycleStatus: PolicyLifecycleStatus.ACTIVE,
      },
    });

    return {
      processingDurationMs: Date.now() - startTime,
      parsingDurationMs,
      normalizationDurationMs,
      chunkGenerationDurationMs,
      storageDurationMs,
      chunksCount: generatedChunks.length,
      skippedDuplicate: false,
    };
  }
}
