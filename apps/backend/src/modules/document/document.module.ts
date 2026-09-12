import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { CitizenModule } from '../citizen/citizen.module';
import { DocumentController } from './controllers/document.controller';
import { PrismaDocumentRepository } from './repositories/prisma-document.repository';
import { PrismaEvidenceRepository } from './repositories/prisma-evidence.repository';
import { PrismaVerificationRepository } from './repositories/prisma-verification.repository';
import { PrismaConflictRepository } from './repositories/prisma-conflict.repository';
import { DocumentStorageService } from './services/document-storage.service';
import { DocumentLifecycleService } from './services/document-lifecycle.service';
import { DocumentClassificationService } from './services/document-classification.service';
import { DocumentQualityAssessmentService } from './services/document-quality-assessment.service';
import { OCROrchestratorService } from './services/ocr-orchestrator.service';
import { OCRExtractionService } from './services/ocr-extraction.service';
import { EvidenceGenerationService } from './services/evidence-generation.service';
import { EvidenceVersionService } from './services/evidence-version.service';
import { EvidenceTrustScoreService } from './services/evidence-trust-score.service';
import { EvidenceGraphService } from './services/evidence-graph.service';
import { VerificationWorkflowService } from './services/verification-workflow.service';
import { VerificationPolicyService } from './services/verification-policy.service';
import { ConfidenceCalculationService } from './services/confidence-calculation.service';
import { ConflictDetectionService } from './services/conflict-detection.service';
import { FactReconciliationService } from './services/fact-reconciliation.service';
import { DocumentDeduplicationService } from './services/document-deduplication.service';
import { ExpiryIntelligenceService } from './services/expiry-intelligence.service';
import { DocumentAnalyticsService } from './services/document-analytics.service';
import { DocumentReplayService } from './services/document-replay.service';
import { DocumentQueryService } from './services/document-query.service';
import { DocumentOrchestrator } from './services/document.orchestrator';
import {
  DOCUMENT_REPOSITORY,
  DOCUMENT_EVIDENCE_REPOSITORY,
  VERIFICATION_REPOSITORY,
  CONFLICT_REPOSITORY,
  DOCUMENT_STORAGE_SERVICE,
  DOCUMENT_LIFECYCLE_SERVICE,
  DOCUMENT_CLASSIFICATION_SERVICE,
  DOCUMENT_QUALITY_ASSESSMENT_SERVICE,
  OCR_ORCHESTRATOR_SERVICE,
  OCR_EXTRACTION_SERVICE,
  EVIDENCE_GENERATION_SERVICE,
  EVIDENCE_VERSION_SERVICE,
  EVIDENCE_TRUST_SCORE_SERVICE,
  EVIDENCE_GRAPH_SERVICE,
  VERIFICATION_WORKFLOW_SERVICE,
  VERIFICATION_POLICY_SERVICE,
  CONFIDENCE_CALCULATION_SERVICE,
  CONFLICT_DETECTION_SERVICE,
  FACT_RECONCILIATION_SERVICE,
  DOCUMENT_DEDUPLICATION_SERVICE,
  EXPIRY_INTELLIGENCE_SERVICE,
  DOCUMENT_ANALYTICS_SERVICE,
  DOCUMENT_REPLAY_SERVICE,
  DOCUMENT_QUERY_SERVICE,
  DOCUMENT_ORCHESTRATOR,
} from '../../core/tokens/injection-tokens';

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule, CitizenModule],
  controllers: [DocumentController],
  providers: [
    { provide: DOCUMENT_REPOSITORY, useClass: PrismaDocumentRepository },
    { provide: DOCUMENT_EVIDENCE_REPOSITORY, useClass: PrismaEvidenceRepository },
    { provide: VERIFICATION_REPOSITORY, useClass: PrismaVerificationRepository },
    { provide: CONFLICT_REPOSITORY, useClass: PrismaConflictRepository },
    { provide: DOCUMENT_STORAGE_SERVICE, useClass: DocumentStorageService },
    { provide: DOCUMENT_LIFECYCLE_SERVICE, useClass: DocumentLifecycleService },
    { provide: DOCUMENT_CLASSIFICATION_SERVICE, useClass: DocumentClassificationService },
    { provide: DOCUMENT_QUALITY_ASSESSMENT_SERVICE, useClass: DocumentQualityAssessmentService },
    { provide: OCR_ORCHESTRATOR_SERVICE, useClass: OCROrchestratorService },
    { provide: OCR_EXTRACTION_SERVICE, useClass: OCRExtractionService },
    { provide: EVIDENCE_GENERATION_SERVICE, useClass: EvidenceGenerationService },
    { provide: EVIDENCE_VERSION_SERVICE, useClass: EvidenceVersionService },
    { provide: EVIDENCE_TRUST_SCORE_SERVICE, useClass: EvidenceTrustScoreService },
    { provide: EVIDENCE_GRAPH_SERVICE, useClass: EvidenceGraphService },
    { provide: VERIFICATION_WORKFLOW_SERVICE, useClass: VerificationWorkflowService },
    { provide: VERIFICATION_POLICY_SERVICE, useClass: VerificationPolicyService },
    { provide: CONFIDENCE_CALCULATION_SERVICE, useClass: ConfidenceCalculationService },
    { provide: CONFLICT_DETECTION_SERVICE, useClass: ConflictDetectionService },
    { provide: FACT_RECONCILIATION_SERVICE, useClass: FactReconciliationService },
    { provide: DOCUMENT_DEDUPLICATION_SERVICE, useClass: DocumentDeduplicationService },
    { provide: EXPIRY_INTELLIGENCE_SERVICE, useClass: ExpiryIntelligenceService },
    { provide: DOCUMENT_ANALYTICS_SERVICE, useClass: DocumentAnalyticsService },
    { provide: DOCUMENT_REPLAY_SERVICE, useClass: DocumentReplayService },
    { provide: DOCUMENT_QUERY_SERVICE, useClass: DocumentQueryService },
    { provide: DOCUMENT_ORCHESTRATOR, useClass: DocumentOrchestrator },
  ],
  exports: [
    DOCUMENT_REPOSITORY,
    DOCUMENT_EVIDENCE_REPOSITORY,
    VERIFICATION_REPOSITORY,
    CONFLICT_REPOSITORY,
    DOCUMENT_ORCHESTRATOR,
    DOCUMENT_QUERY_SERVICE,
  ],
})
export class DocumentModule {}
