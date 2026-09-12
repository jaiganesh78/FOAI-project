import { Module } from '@nestjs/common';
import {
  DECISION_RE_EVALUATION_REPOSITORY,
  CHANGE_DETECTION_SERVICE,
  DECISION_IMPACT_ANALYSIS_SERVICE,
  DECISION_DEPENDENCY_RESOLUTION_SERVICE,
  RE_EVALUATION_PLANNER_SERVICE,
  RE_EVALUATION_EXECUTOR_SERVICE,
  ELIGIBILITY_RE_EVALUATION_SERVICE,
  RECOMMENDATION_RE_EVALUATION_SERVICE,
  JOURNEY_RE_EVALUATION_SERVICE,
  DECISION_DIFF_SERVICE,
  STALE_STATE_SERVICE,
  POLICY_CHANGE_INTELLIGENCE_SERVICE,
  RE_EVALUATION_REPLAY_SERVICE,
  RE_EVALUATION_ANALYTICS_SERVICE,
  DECISION_RE_EVALUATION_ORCHESTRATOR,
} from '../../core/tokens/injection-tokens';
import { PrismaDecisionReEvaluationRepository } from './repositories/prisma-decision-re-evaluation.repository';
import { ChangeDetectionService } from './services/change-detection.service';
import { ImpactAnalysisService } from './services/impact-analysis.service';
import { DependencyResolutionService } from './services/dependency-resolution.service';
import { ReEvaluationPlannerService } from './services/re-evaluation-planner.service';
import { ReEvaluationExecutorService } from './services/re-evaluation-executor.service';
import { EligibilityReEvaluationService } from './services/eligibility-re-evaluation.service';
import { RecommendationReEvaluationService } from './services/recommendation-re-evaluation.service';
import { JourneyReEvaluationService } from './services/journey-re-evaluation.service';
import { DecisionDiffService } from './services/decision-diff.service';
import { StaleStateService } from './services/stale-state.service';
import { PolicyChangeService } from './services/policy-change.service';
import { ReEvaluationReplayService } from './services/re-evaluation-replay.service';
import { ReEvaluationAnalyticsService } from './services/re-evaluation-analytics.service';
import { DecisionReEvaluationOrchestrator } from './services/decision-re-evaluation.orchestrator';
import { DecisionReEvaluationController } from './controllers/decision-re-evaluation.controller';

import { EligibilityModule } from '../eligibility/eligibility.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { ApplicationJourneyModule } from '../application-journey/application-journey.module';
import { CitizenModule } from '../citizen/citizen.module';
import { DocumentModule } from '../document/document.module';
import { FactVerificationModule } from '../fact-verification/fact-verification.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [
    DatabaseModule,
    EventBusModule,
    ClockModule,
    AuthModule,
    EligibilityModule,
    RecommendationModule,
    ApplicationJourneyModule,
    CitizenModule,
    DocumentModule,
    FactVerificationModule,
  ],
  controllers: [DecisionReEvaluationController],
  providers: [
    ChangeDetectionService,
    ImpactAnalysisService,
    DependencyResolutionService,
    ReEvaluationPlannerService,
    ReEvaluationExecutorService,
    EligibilityReEvaluationService,
    RecommendationReEvaluationService,
    JourneyReEvaluationService,
    DecisionDiffService,
    StaleStateService,
    PolicyChangeService,
    ReEvaluationReplayService,
    ReEvaluationAnalyticsService,
    DecisionReEvaluationOrchestrator,
    {
      provide: DECISION_RE_EVALUATION_REPOSITORY,
      useClass: PrismaDecisionReEvaluationRepository,
    },
    {
      provide: CHANGE_DETECTION_SERVICE,
      useClass: ChangeDetectionService,
    },
    {
      provide: DECISION_IMPACT_ANALYSIS_SERVICE,
      useClass: ImpactAnalysisService,
    },
    {
      provide: DECISION_DEPENDENCY_RESOLUTION_SERVICE,
      useClass: DependencyResolutionService,
    },
    {
      provide: RE_EVALUATION_PLANNER_SERVICE,
      useClass: ReEvaluationPlannerService,
    },
    {
      provide: RE_EVALUATION_EXECUTOR_SERVICE,
      useClass: ReEvaluationExecutorService,
    },
    {
      provide: ELIGIBILITY_RE_EVALUATION_SERVICE,
      useClass: EligibilityReEvaluationService,
    },
    {
      provide: RECOMMENDATION_RE_EVALUATION_SERVICE,
      useClass: RecommendationReEvaluationService,
    },
    {
      provide: JOURNEY_RE_EVALUATION_SERVICE,
      useClass: JourneyReEvaluationService,
    },
    {
      provide: DECISION_DIFF_SERVICE,
      useClass: DecisionDiffService,
    },
    {
      provide: STALE_STATE_SERVICE,
      useClass: StaleStateService,
    },
    {
      provide: POLICY_CHANGE_INTELLIGENCE_SERVICE,
      useClass: PolicyChangeService,
    },
    {
      provide: RE_EVALUATION_REPLAY_SERVICE,
      useClass: ReEvaluationReplayService,
    },
    {
      provide: RE_EVALUATION_ANALYTICS_SERVICE,
      useClass: ReEvaluationAnalyticsService,
    },
    {
      provide: DECISION_RE_EVALUATION_ORCHESTRATOR,
      useClass: DecisionReEvaluationOrchestrator,
    },
  ],
  exports: [
    DECISION_RE_EVALUATION_ORCHESTRATOR,
    STALE_STATE_SERVICE,
    POLICY_CHANGE_INTELLIGENCE_SERVICE,
    RE_EVALUATION_REPLAY_SERVICE,
  ],
})
export class DecisionReEvaluationModule {}
