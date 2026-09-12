import { Controller, Post, Get, Body, Param, UseGuards, Inject, ForbiddenException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  FACT_VERIFICATION_ORCHESTRATOR,
  FACT_VERIFICATION_REVIEW_SERVICE,
  FACT_VERIFICATION_REPLAY_SERVICE,
  EVIDENCE_CHAIN_VALIDATION_SERVICE,
  FACT_VERIFICATION_IMPACT_ENGINE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { FactVerificationOrchestrator } from '../services/fact-verification.orchestrator';
import { FactVerificationReviewService } from '../services/fact-verification-review.service';
import { FactVerificationReplayService } from '../services/fact-verification-replay.service';
import { EvidenceChainValidationService } from '../services/evidence-chain-validation.service';
import { FactVerificationImpactEngineService } from '../services/fact-verification-impact-engine.service';
import { VerifyFactRequestDto, AssignReviewDto, CompleteReviewDto } from '@gpios/shared';

interface AuthenticatedUser {
  id: string;
  roles?: string[];
}

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Controller('api/v1/fact-verification')
@UseGuards(JwtAuthGuard)
export class FactVerificationController {
  constructor(
    @Inject(FACT_VERIFICATION_ORCHESTRATOR) private readonly orchestrator: FactVerificationOrchestrator,
    @Inject(FACT_VERIFICATION_REVIEW_SERVICE) private readonly reviewService: FactVerificationReviewService,
    @Inject(FACT_VERIFICATION_REPLAY_SERVICE) private readonly replayService: FactVerificationReplayService,
    @Inject(EVIDENCE_CHAIN_VALIDATION_SERVICE) private readonly evidenceChainService: EvidenceChainValidationService,
    @Inject(FACT_VERIFICATION_IMPACT_ENGINE_SERVICE) private readonly impactEngine: FactVerificationImpactEngineService,
  ) {}

  @Post('verify')
  async verifyFact(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyFactRequestDto) {
    return this.orchestrator.runVerification(user.id, dto);
  }

  @Get('facts/:factId/evidence-chain/:attributeKey')
  async getEvidenceChain(
    @CurrentUser() user: AuthenticatedUser,
    @Param('factId') factId: string,
    @Param('attributeKey') attributeKey: string,
  ) {
    return this.evidenceChainService.validateEvidenceChain(user.id, factId, attributeKey);
  }

  @Get('reviews')
  async listReviews(@CurrentUser() user: AuthenticatedUser, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    if (!roles.includes('GOVERNMENT_OFFICER') && !roles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Citizens cannot access officer review queues.');
    }
    return this.reviewService.listReviewsForCitizen(user.id);
  }

  @Post('reviews/:reviewId/assign')
  async assignReview(@Param('reviewId') reviewId: string, @Body() dto: AssignReviewDto, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    return this.reviewService.assignReview(reviewId, dto.officerId, roles);
  }

  @Post('reviews/:reviewId/complete')
  async completeReview(@Param('reviewId') reviewId: string, @Body() dto: CompleteReviewDto, @Req() req: AuthenticatedRequest) {
    const roles = req.user?.roles || ['CITIZEN'];
    return this.reviewService.completeReview(reviewId, dto.decision, dto.reason, roles);
  }

  @Get('runs/:verificationRunId/replay')
  async replayVerification(@CurrentUser() _user: AuthenticatedUser, @Param('verificationRunId') runId: string) {
    return this.replayService.replayVerification(runId);
  }

  @Get('impact/:factId/:attributeKey')
  async getImpact(
    @CurrentUser() _user: AuthenticatedUser,
    @Param('factId') factId: string,
    @Param('attributeKey') attributeKey: string,
  ) {
    return this.impactEngine.calculateImpact({
      factId,
      attributeKey,
      requiresManualReview: false,
      correlationId: `query_${factId}`,
    });
  }

  @Get('health')
  async getHealth() {
    return { status: 'HEALTHY', engine: 'FactVerificationOrchestrator', timestamp: new Date().toISOString() };
  }
}
