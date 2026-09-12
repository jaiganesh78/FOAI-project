import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  DOCUMENT_STORAGE_SERVICE,
  DOCUMENT_LIFECYCLE_SERVICE,
  DOCUMENT_CLASSIFICATION_SERVICE,
  DOCUMENT_QUALITY_ASSESSMENT_SERVICE,
  OCR_ORCHESTRATOR_SERVICE,
  OCR_EXTRACTION_SERVICE,
  EVIDENCE_GENERATION_SERVICE,
  EVIDENCE_TRUST_SCORE_SERVICE,
  EVIDENCE_GRAPH_SERVICE,
  VERIFICATION_WORKFLOW_SERVICE,
  VERIFICATION_POLICY_SERVICE,
  CONFLICT_DETECTION_SERVICE,
  FACT_RECONCILIATION_SERVICE,
  DOCUMENT_DEDUPLICATION_SERVICE,
  DOCUMENT_ANALYTICS_SERVICE,
  CITIZEN_QUERY_SERVICE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IDocumentRepository } from '../repositories/document.repository.interface';
import { DocumentStorageService } from './document-storage.service';
import { DocumentLifecycleService } from './document-lifecycle.service';
import { DocumentClassificationService } from './document-classification.service';
import { DocumentQualityAssessmentService } from './document-quality-assessment.service';
import { OCROrchestratorService } from './ocr-orchestrator.service';
import { OCRExtractionService } from './ocr-extraction.service';
import { EvidenceGenerationService } from './evidence-generation.service';
import { EvidenceTrustScoreService } from './evidence-trust-score.service';
import { EvidenceGraphService } from './evidence-graph.service';
import { VerificationWorkflowService } from './verification-workflow.service';
import { VerificationPolicyService } from './verification-policy.service';
import { ConflictDetectionService } from './conflict-detection.service';
import { FactReconciliationService } from './fact-reconciliation.service';
import { DocumentDeduplicationService } from './document-deduplication.service';
import { DocumentAnalyticsService } from './document-analytics.service';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import {
  DocumentDto,
  DocumentStatus,
  DocumentType,
  DocumentSource,
  VerificationMethod,
  DomainEventRegistry,
  DocumentVerificationStatus,
} from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentOrchestrator {
  private readonly logger = new Logger(DocumentOrchestrator.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepo: IDocumentRepository,
    @Inject(DOCUMENT_STORAGE_SERVICE) private readonly storageService: DocumentStorageService,
    @Inject(DOCUMENT_LIFECYCLE_SERVICE) private readonly lifecycleService: DocumentLifecycleService,
    @Inject(DOCUMENT_CLASSIFICATION_SERVICE) private readonly classificationService: DocumentClassificationService,
    @Inject(DOCUMENT_QUALITY_ASSESSMENT_SERVICE) private readonly qualityService: DocumentQualityAssessmentService,
    @Inject(OCR_ORCHESTRATOR_SERVICE) private readonly ocrOrchestrator: OCROrchestratorService,
    @Inject(OCR_EXTRACTION_SERVICE) private readonly ocrExtractionService: OCRExtractionService,
    @Inject(EVIDENCE_GENERATION_SERVICE) private readonly evidenceGenerationService: EvidenceGenerationService,
    @Inject(EVIDENCE_TRUST_SCORE_SERVICE) private readonly trustScoreService: EvidenceTrustScoreService,
    @Inject(EVIDENCE_GRAPH_SERVICE) private readonly evidenceGraphService: EvidenceGraphService,
    @Inject(VERIFICATION_WORKFLOW_SERVICE) private readonly verificationWorkflowService: VerificationWorkflowService,
    @Inject(VERIFICATION_POLICY_SERVICE) private readonly verificationPolicyService: VerificationPolicyService,
    @Inject(CONFLICT_DETECTION_SERVICE) private readonly conflictDetectionService: ConflictDetectionService,
    @Inject(FACT_RECONCILIATION_SERVICE) private readonly factReconciliationService: FactReconciliationService,
    @Inject(DOCUMENT_DEDUPLICATION_SERVICE) private readonly deduplicationService: DocumentDeduplicationService,
    @Inject(DOCUMENT_ANALYTICS_SERVICE) private readonly analyticsService: DocumentAnalyticsService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async uploadAndProcessDocument(params: {
    userId: string;
    fileName: string;
    fileContent: Buffer;
    mimeType: string;
    documentType: DocumentType;
    source?: DocumentSource;
  }): Promise<DocumentDto> {
    this.logger.log(`Processing document upload '${params.fileName}' for user ${params.userId}`);

    // 1. Checksum & Deduplication
    const checksum = this.deduplicationService.computeChecksum(params.fileContent);
    const existingDoc = await this.deduplicationService.checkDuplicate(checksum);

    // 2. Storage
    const storageUrl = await this.storageService.storeFile(params.fileName, params.fileContent, params.mimeType);

    // 3. Persist Document Record
    const doc = await this.documentRepo.createDocument({
      userId: params.userId,
      fileName: params.fileName,
      fileSize: params.fileContent.length,
      mimeType: params.mimeType,
      storageUrl,
      checksumSha256: checksum,
      documentType: params.documentType,
      source: params.source || DocumentSource.CITIZEN_UPLOAD,
    });

    if (existingDoc) {
      await this.deduplicationService.createAlias(existingDoc.id, doc.id, checksum);
    }

    // 4. Document Classification
    const classification = this.classificationService.classifyDocument(doc.id, doc.fileName, doc.mimeType, doc.fileSize);
    await this.documentRepo.saveClassification(doc.id, classification as any);
    this.lifecycleService.validateTransition(doc.status as DocumentStatus, DocumentStatus.CLASSIFIED);
    await this.documentRepo.updateStatus(doc.id, DocumentStatus.CLASSIFIED);

    // 5. Document Quality Assessment
    const quality = this.qualityService.assessQuality(doc.id, doc.fileSize, doc.mimeType);
    await this.documentRepo.saveQuality(doc.id, quality as any);
    this.lifecycleService.validateTransition(DocumentStatus.CLASSIFIED, DocumentStatus.QUALITY_CHECKED);
    await this.documentRepo.updateStatus(doc.id, DocumentStatus.QUALITY_CHECKED);

    // 6. OCR & Fact Extraction
    const { blocks } = await this.ocrOrchestrator.processOCR(doc.id, classification.ocrTemplateId);
    this.lifecycleService.validateTransition(DocumentStatus.QUALITY_CHECKED, DocumentStatus.OCR_PROCESSED);
    await this.documentRepo.updateStatus(doc.id, DocumentStatus.OCR_PROCESSED);

    const extractedFacts = this.ocrExtractionService.extractFactsFromBlocks(doc.id, blocks);
    this.lifecycleService.validateTransition(DocumentStatus.OCR_PROCESSED, DocumentStatus.FACTS_EXTRACTED);
    await this.documentRepo.updateStatus(doc.id, DocumentStatus.FACTS_EXTRACTED);

    // 7. Evidence Generation & Trust Scoring
    const evidences = await this.evidenceGenerationService.generateEvidenceForFacts({
      documentId: doc.id,
      userId: params.userId,
      extractedFacts,
    });

    let calculatedTrustScore = 95.0;
    for (const ev of evidences) {
      const trustScoreResult = this.trustScoreService.calculateTrustScore({
        evidenceId: ev.id,
        ocrQualityScore: quality.qualityScore,
        documentQualityScore: quality.qualityScore,
      });
      calculatedTrustScore = trustScoreResult.trustScore;

      this.evidenceGraphService.buildProvenanceGraph({
        evidenceId: ev.id,
        factKey: ev.factKey,
        documentId: doc.id,
        fileName: doc.fileName,
      });
    }

    await this.documentRepo.updateTrustScore(doc.id, calculatedTrustScore);

    // 8. Conflict Detection with Citizen Facts
    const citizenFacts = await this.citizenQueryService.getStructuredFactsByUserId(params.userId);
    const conflicts = await this.conflictDetectionService.detectAndRecordConflicts({
      documentId: doc.id,
      userId: params.userId,
      citizenFacts,
      extractedFacts,
    });

    // 9. Verification Workflow
    const verification = await this.verificationWorkflowService.startVerification(doc.id, params.userId, VerificationMethod.CITIZEN_UPLOAD);
    const targetStatus = this.verificationPolicyService.evaluateVerificationRequirements(VerificationMethod.CITIZEN_UPLOAD, quality.qualityScore);
    await this.verificationWorkflowService.completeVerification(verification.id, targetStatus, 'Automated document verification pipeline');

    // 10. Fact Reconciliation & Activation
    if (conflicts.length === 0 && targetStatus === DocumentVerificationStatus.VERIFIED) {
      for (const extracted of extractedFacts) {
        // Auto-reconcile non-conflicting extracted facts into citizen profile
        await this.factReconciliationService.reconcileConflict({
          conflictId: `auto-${extracted.id}`,
          resolutionType: 'ACCEPT_DOCUMENT' as any,
          reconciledBy: 'SYSTEM_OCR',
        }).catch(() => null);
      }
      this.lifecycleService.validateTransition(DocumentStatus.FACTS_EXTRACTED, DocumentStatus.VERIFICATION_PENDING);
      await this.documentRepo.updateStatus(doc.id, DocumentStatus.VERIFICATION_PENDING);
      this.lifecycleService.validateTransition(DocumentStatus.VERIFICATION_PENDING, DocumentStatus.ACTIVE);
      await this.documentRepo.updateStatus(doc.id, DocumentStatus.ACTIVE);
    } else {
      this.lifecycleService.validateTransition(DocumentStatus.FACTS_EXTRACTED, DocumentStatus.VERIFICATION_PENDING);
      await this.documentRepo.updateStatus(doc.id, DocumentStatus.VERIFICATION_PENDING);
    }

    // 11. Record Analytics & Events
    await this.analyticsService.recordAnalytics({
      userId: params.userId,
      averageTrustScore: calculatedTrustScore,
      totalConflictedDocuments: conflicts.length,
    });

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Document.Uploaded,
      eventVersion: '1.0',
      aggregateId: doc.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        documentId: doc.id,
        userId: params.userId,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        checksumSha256: checksum,
        source: doc.source,
      },
    });

    const updatedDoc = await this.documentRepo.findById(doc.id);
    return this.mapToDocumentDto(updatedDoc!, classification, quality);
  }

  private mapToDocumentDto(doc: any, classification: any, quality: any): DocumentDto {
    return {
      id: doc.id,
      userId: doc.userId,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      storageUrl: doc.storageUrl,
      checksumSha256: doc.checksumSha256,
      documentType: doc.documentType,
      source: doc.source,
      status: doc.status,
      classification,
      quality,
      trustScore: doc.trustScore || 95.0,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
