import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  DOCUMENT_ORCHESTRATOR,
  DOCUMENT_QUERY_SERVICE,
  DOCUMENT_CLASSIFICATION_SERVICE,
  DOCUMENT_QUALITY_ASSESSMENT_SERVICE,
  EVIDENCE_TRUST_SCORE_SERVICE,
  EVIDENCE_GRAPH_SERVICE,
  VERIFICATION_WORKFLOW_SERVICE,
  FACT_RECONCILIATION_SERVICE,
  EXPIRY_INTELLIGENCE_SERVICE,
  DOCUMENT_ANALYTICS_SERVICE,
  DOCUMENT_REPLAY_SERVICE,
  DOCUMENT_LIFECYCLE_SERVICE,
  DOCUMENT_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { DocumentOrchestrator } from '../services/document.orchestrator';
import { DocumentQueryService } from '../services/document-query.service';
import { DocumentClassificationService } from '../services/document-classification.service';
import { DocumentQualityAssessmentService } from '../services/document-quality-assessment.service';
import { EvidenceTrustScoreService } from '../services/evidence-trust-score.service';
import { EvidenceGraphService } from '../services/evidence-graph.service';
import { VerificationWorkflowService } from '../services/verification-workflow.service';
import { FactReconciliationService } from '../services/fact-reconciliation.service';
import { ExpiryIntelligenceService } from '../services/expiry-intelligence.service';
import { DocumentAnalyticsService } from '../services/document-analytics.service';
import { DocumentReplayService } from '../services/document-replay.service';
import { DocumentLifecycleService } from '../services/document-lifecycle.service';
import { IDocumentRepository } from '../repositories/document.repository.interface';
import {
  DocumentVerificationStatus,
  DocumentStatus,
  DocumentType,
  ConflictResolutionType,
} from '@gpios/shared';

@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    @Inject(DOCUMENT_ORCHESTRATOR) private readonly orchestrator: DocumentOrchestrator,
    @Inject(DOCUMENT_QUERY_SERVICE) private readonly queryService: DocumentQueryService,
    @Inject(DOCUMENT_CLASSIFICATION_SERVICE) private readonly classificationService: DocumentClassificationService,
    @Inject(DOCUMENT_QUALITY_ASSESSMENT_SERVICE) private readonly qualityService: DocumentQualityAssessmentService,
    @Inject(EVIDENCE_TRUST_SCORE_SERVICE) private readonly trustScoreService: EvidenceTrustScoreService,
    @Inject(EVIDENCE_GRAPH_SERVICE) private readonly evidenceGraphService: EvidenceGraphService,
    @Inject(VERIFICATION_WORKFLOW_SERVICE) private readonly verificationWorkflowService: VerificationWorkflowService,
    @Inject(FACT_RECONCILIATION_SERVICE) private readonly reconciliationService: FactReconciliationService,
    @Inject(EXPIRY_INTELLIGENCE_SERVICE) private readonly expiryService: ExpiryIntelligenceService,
    @Inject(DOCUMENT_ANALYTICS_SERVICE) private readonly analyticsService: DocumentAnalyticsService,
    @Inject(DOCUMENT_REPLAY_SERVICE) private readonly replayService: DocumentReplayService,
    @Inject(DOCUMENT_LIFECYCLE_SERVICE) private readonly lifecycleService: DocumentLifecycleService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepo: IDocumentRepository,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(@CurrentUser() user: any, @Body() dto: any) {
    const content = Buffer.from(dto.fileContentBase64 || 'sample document text content', 'utf-8');
    return this.orchestrator.uploadAndProcessDocument({
      userId: user.id,
      fileName: dto.fileName || 'document.pdf',
      fileContent: content,
      mimeType: dto.mimeType || 'application/pdf',
      documentType: dto.documentType || DocumentType.INCOME_CERTIFICATE,
      source: dto.source,
    });
  }

  @Get()
  async getUserDocuments(@CurrentUser() user: any) {
    return this.queryService.getDocumentsByUserId(user.id);
  }

  @Get('conflicts/all')
  async getUserConflicts(@CurrentUser() user: any) {
    return this.queryService.getConflictsByUserId(user.id);
  }

  @Get('analytics/summary')
  async getAnalyticsSummary(@CurrentUser() user: any) {
    return this.analyticsService.getLatestAnalytics(user.id);
  }

  @Get('evidence/trust-scores')
  async getTrustScores(@CurrentUser() user: any) {
    const evidences = await this.queryService.getEvidencesByUserId(user.id);
    return evidences.map((ev) =>
      this.trustScoreService.calculateTrustScore({ evidenceId: ev.id }),
    );
  }

  @Get('evidence/provenance-graph')
  async getProvenanceGraph(@CurrentUser() user: any) {
    const evidences = await this.queryService.getEvidencesByUserId(user.id);
    return evidences.map((ev) =>
      this.evidenceGraphService.buildProvenanceGraph({
        evidenceId: ev.id,
        factKey: ev.factKey,
        documentId: ev.documentId,
        fileName: 'document.pdf',
      }),
    );
  }

  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    return doc;
  }

  @Get(':id/classification')
  async getClassification(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    return (
      doc.classification ||
      this.classificationService.classifyDocument(id, doc.fileName, doc.mimeType, doc.fileSize)
    );
  }

  @Get(':id/quality')
  async getQuality(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    return (
      doc.quality || this.qualityService.assessQuality(id, doc.fileSize, doc.mimeType)
    );
  }

  @Get(':id/evidence')
  async getDocumentEvidence(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    return doc;
  }

  @Get(':id/verification')
  async getVerification(@Param('id') id: string) {
    return this.queryService.getVerificationByDocumentId(id);
  }

  @Post(':id/verify')
  async verifyDocument(
    @Param('id') id: string,
    @Body() body: { status?: DocumentVerificationStatus; notes?: string },
  ) {
    const verification = await this.queryService.getVerificationByDocumentId(id);
    if (!verification) throw new NotFoundException(`Verification for document '${id}' not found.`);
    return this.verificationWorkflowService.completeVerification(
      verification.id,
      body.status || DocumentVerificationStatus.VERIFIED,
      body.notes || 'Officer manual verification override',
    );
  }

  @Post('conflicts/:id/reconcile')
  async reconcileConflict(
    @CurrentUser() user: any,
    @Param('id') conflictId: string,
    @Body() dto: { resolutionType: ConflictResolutionType; overrideValue?: unknown },
  ) {
    return this.reconciliationService.reconcileConflict({
      conflictId,
      resolutionType: dto.resolutionType,
      overrideValue: dto.overrideValue,
      reconciledBy: user.id,
    });
  }

  @Get(':id/expiry')
  async getExpiry(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    return this.expiryService.computeExpiry(id, doc.documentType as DocumentType);
  }

  @Get(':id/replay')
  async replayDocument(@Param('id') id: string) {
    return this.replayService.replayDocumentHistory(id);
  }

  @Post(':id/archive')
  async archiveDocument(@Param('id') id: string) {
    const doc = await this.queryService.getDocumentById(id);
    if (!doc) throw new NotFoundException(`Document '${id}' not found.`);
    this.lifecycleService.validateTransition(doc.status as DocumentStatus, DocumentStatus.ARCHIVED);
    return this.documentRepo.updateStatus(id, DocumentStatus.ARCHIVED);
  }
}
