import { Module } from '@nestjs/common';
import {
  KNOWLEDGE_SOURCE_REPOSITORY,
  POLICY_DOCUMENT_REPOSITORY,
  POLICY_VERSION_REPOSITORY,
  POLICY_CHUNK_REPOSITORY,
  INGESTION_JOB_REPOSITORY,
  POLICY_FINGERPRINT_SERVICE,
  REFRESH_SCHEDULER_SERVICE,
  DOCUMENT_PROCESSING_PIPELINE,
  METADATA_EXTRACTION_SERVICE,
  POLICY_NORMALIZATION_SERVICE,
  CHUNK_GENERATION_SERVICE,
  KNOWLEDGE_QUALITY_SERVICE,
  KNOWLEDGE_QUERY_SERVICE,
  KNOWLEDGE_STATISTICS_SERVICE,
  KNOWLEDGE_SOURCE_SERVICE,
  KNOWLEDGE_INGESTION_SERVICE,
  CONNECTOR_FACTORY,
  PARSER_REGISTRY,
} from '../../core/tokens/injection-tokens';
import { PrismaKnowledgeSourceRepository } from './repositories/prisma-knowledge-source.repository';
import { PrismaPolicyDocumentRepository } from './repositories/prisma-policy-document.repository';
import { PrismaPolicyVersionRepository } from './repositories/prisma-policy-version.repository';
import { PrismaPolicyChunkRepository } from './repositories/prisma-policy-chunk.repository';
import { PrismaIngestionJobRepository } from './repositories/prisma-ingestion-job.repository';

import { ApiConnector } from './connectors/api.connector';
import { WebScrapingConnector } from './connectors/web-scraping.connector';
import { PdfConnector } from './connectors/pdf.connector';
import { ManualUploadConnector } from './connectors/manual-upload.connector';
import { ConnectorFactory } from './connectors/connector.factory';

import { PdfParser } from './parsers/pdf.parser';
import { HtmlParser } from './parsers/html.parser';
import { JsonParser } from './parsers/json.parser';
import { XmlParser } from './parsers/xml.parser';
import { PlainTextParser } from './parsers/plain-text.parser';
import { ParserRegistry } from './parsers/parser.registry';

import { PolicyFingerprintService } from './services/policy-fingerprint.service';
import { RefreshSchedulerService } from './services/refresh-scheduler.service';
import { DocumentClassificationEngine } from './services/document-classification.engine';
import { MetadataExtractionService } from './services/metadata-extraction.service';
import { PolicyNormalizationService } from './services/policy-normalization.service';
import { ChunkGenerationService } from './services/chunk-generation.service';
import { KnowledgeQualityService } from './services/knowledge-quality.service';
import { KnowledgeIntegrityVerificationService } from './services/knowledge-integrity.service';
import { DocumentProcessingPipeline } from './services/document-processing.pipeline';
import { KnowledgeQueryService } from './services/knowledge-query.service';
import { KnowledgeStatisticsService } from './services/knowledge-statistics.service';
import { KnowledgeSourceService } from './services/knowledge-source.service';
import { KnowledgeIngestionService } from './services/knowledge-ingestion.service';

import { KnowledgeController } from './controllers/knowledge.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule],
  controllers: [KnowledgeController],
  providers: [
    // Repositories
    { provide: KNOWLEDGE_SOURCE_REPOSITORY, useClass: PrismaKnowledgeSourceRepository },
    { provide: POLICY_DOCUMENT_REPOSITORY, useClass: PrismaPolicyDocumentRepository },
    { provide: POLICY_VERSION_REPOSITORY, useClass: PrismaPolicyVersionRepository },
    { provide: POLICY_CHUNK_REPOSITORY, useClass: PrismaPolicyChunkRepository },
    { provide: INGESTION_JOB_REPOSITORY, useClass: PrismaIngestionJobRepository },

    // Connectors & Parsers
    ApiConnector,
    WebScrapingConnector,
    PdfConnector,
    ManualUploadConnector,
    { provide: CONNECTOR_FACTORY, useClass: ConnectorFactory },

    PdfParser,
    HtmlParser,
    JsonParser,
    XmlParser,
    PlainTextParser,
    { provide: PARSER_REGISTRY, useClass: ParserRegistry },

    // Services & Engines
    { provide: POLICY_FINGERPRINT_SERVICE, useClass: PolicyFingerprintService },
    { provide: REFRESH_SCHEDULER_SERVICE, useClass: RefreshSchedulerService },
    DocumentClassificationEngine,
    { provide: METADATA_EXTRACTION_SERVICE, useClass: MetadataExtractionService },
    { provide: POLICY_NORMALIZATION_SERVICE, useClass: PolicyNormalizationService },
    { provide: CHUNK_GENERATION_SERVICE, useClass: ChunkGenerationService },
    { provide: KNOWLEDGE_QUALITY_SERVICE, useClass: KnowledgeQualityService },
    KnowledgeIntegrityVerificationService,
    { provide: DOCUMENT_PROCESSING_PIPELINE, useClass: DocumentProcessingPipeline },
    { provide: KNOWLEDGE_QUERY_SERVICE, useClass: KnowledgeQueryService },
    { provide: KNOWLEDGE_STATISTICS_SERVICE, useClass: KnowledgeStatisticsService },
    { provide: KNOWLEDGE_SOURCE_SERVICE, useClass: KnowledgeSourceService },
    { provide: KNOWLEDGE_INGESTION_SERVICE, useClass: KnowledgeIngestionService },
  ],
  exports: [
    KNOWLEDGE_QUERY_SERVICE,
    KNOWLEDGE_SOURCE_SERVICE,
    KNOWLEDGE_INGESTION_SERVICE,
    KNOWLEDGE_STATISTICS_SERVICE,
  ],
})
export class KnowledgeModule {}
