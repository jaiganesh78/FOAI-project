import { Module } from '@nestjs/common';
import {
  FACT_VERIFICATION_REPOSITORY,
  CANONICAL_FACT_RESOLUTION_SERVICE,
  FACT_CONFLICT_ENGINE_SERVICE,
  FACT_VERIFICATION_POLICY_ENGINE_SERVICE,
  EVIDENCE_CHAIN_VALIDATION_SERVICE,
  FACT_FRESHNESS_REVALIDATION_SERVICE,
  FACT_RECONCILIATION_WORKFLOW_SERVICE,
  FACT_VERIFICATION_REVIEW_SERVICE,
  FACT_VERIFICATION_REPLAY_SERVICE,
  FACT_VERIFICATION_IMPACT_ENGINE_SERVICE,
  FACT_VERIFICATION_ORCHESTRATOR,
} from '../../core/tokens/injection-tokens';
import { PrismaFactVerificationRepository } from './repositories/prisma-fact-verification.repository';
import { FactVerificationPolicyEngineService } from './services/fact-verification-policy-engine.service';
import { FactConflictEngineService } from './services/fact-conflict-engine.service';
import { EvidenceChainValidationService } from './services/evidence-chain-validation.service';
import { FactFreshnessRevalidationService } from './services/fact-freshness-revalidation.service';
import { CanonicalFactResolutionService } from './services/canonical-fact-resolution.service';
import { FactVerificationReviewService } from './services/fact-verification-review.service';
import { FactVerificationReplayService } from './services/fact-verification-replay.service';
import { FactVerificationImpactEngineService } from './services/fact-verification-impact-engine.service';
import { FactReconciliationWorkflowService } from './services/fact-reconciliation-workflow.service';
import { FactVerificationOrchestrator } from './services/fact-verification.orchestrator';
import { FactVerificationController } from './controllers/fact-verification.controller';

import { CitizenModule } from '../citizen/citizen.module';
import { DocumentModule } from '../document/document.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule, CitizenModule, DocumentModule],
  controllers: [FactVerificationController],
  providers: [
    FactVerificationPolicyEngineService,
    FactConflictEngineService,
    EvidenceChainValidationService,
    FactFreshnessRevalidationService,
    CanonicalFactResolutionService,
    FactVerificationReviewService,
    FactVerificationReplayService,
    FactVerificationImpactEngineService,
    FactReconciliationWorkflowService,
    FactVerificationOrchestrator,
    {
      provide: FACT_VERIFICATION_REPOSITORY,
      useClass: PrismaFactVerificationRepository,
    },
    {
      provide: FACT_VERIFICATION_POLICY_ENGINE_SERVICE,
      useClass: FactVerificationPolicyEngineService,
    },
    {
      provide: FACT_CONFLICT_ENGINE_SERVICE,
      useClass: FactConflictEngineService,
    },
    {
      provide: EVIDENCE_CHAIN_VALIDATION_SERVICE,
      useClass: EvidenceChainValidationService,
    },
    {
      provide: FACT_FRESHNESS_REVALIDATION_SERVICE,
      useClass: FactFreshnessRevalidationService,
    },
    {
      provide: CANONICAL_FACT_RESOLUTION_SERVICE,
      useClass: CanonicalFactResolutionService,
    },
    {
      provide: FACT_VERIFICATION_REVIEW_SERVICE,
      useClass: FactVerificationReviewService,
    },
    {
      provide: FACT_VERIFICATION_REPLAY_SERVICE,
      useClass: FactVerificationReplayService,
    },
    {
      provide: FACT_VERIFICATION_IMPACT_ENGINE_SERVICE,
      useClass: FactVerificationImpactEngineService,
    },
    {
      provide: FACT_RECONCILIATION_WORKFLOW_SERVICE,
      useClass: FactReconciliationWorkflowService,
    },
    {
      provide: FACT_VERIFICATION_ORCHESTRATOR,
      useClass: FactVerificationOrchestrator,
    },
  ],
  exports: [
    FACT_VERIFICATION_ORCHESTRATOR,
    FACT_VERIFICATION_POLICY_ENGINE_SERVICE,
    FACT_VERIFICATION_REPLAY_SERVICE,
    FACT_VERIFICATION_REVIEW_SERVICE,
  ],
})
export class FactVerificationModule {}
