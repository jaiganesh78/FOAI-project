import { Module } from '@nestjs/common';
import {
  ONBOARDING_SESSION_REPOSITORY,
  DISCOVERY_BLUEPRINT_REPOSITORY,
  QUESTION_CATALOG_REPOSITORY,
  ANSWER_NORMALIZATION_ENGINE,
  QUESTION_VISIBILITY_ENGINE,
  PROGRESS_CALCULATION_STRATEGY,
  BLUEPRINT_MIGRATION_SERVICE,
  ONBOARDING_WORKFLOW_ENGINE,
  ONBOARDING_SESSION_SERVICE,
  ONBOARDING_ANALYTICS_SERVICE,
  ONBOARDING_QUESTION_REPOSITORY,
  ADAPTIVE_QUESTION_ENGINE_SERVICE,
  QUESTION_DEPENDENCY_ENGINE_SERVICE,
  QUESTION_PRIORITIZATION_ENGINE_SERVICE,
  DOCUMENT_AWARE_QUESTION_ENGINE_SERVICE,
  ANSWER_PROCESSING_ENGINE_SERVICE,
  QUESTION_EXPLAINABILITY_SERVICE,
  ONBOARDING_SESSION_ENGINE_SERVICE,
} from '../../core/tokens/injection-tokens';
import { PrismaOnboardingSessionRepository } from './repositories/prisma-onboarding-session.repository';
import { PrismaDiscoveryBlueprintRepository } from './repositories/prisma-discovery-blueprint.repository';
import { PrismaQuestionCatalogRepository } from './repositories/prisma-question-catalog.repository';
import { PrismaOnboardingQuestionRepository } from './repositories/prisma-onboarding-question.repository';

import { AnswerNormalizationEngine } from './services/answer-normalization.engine';
import { QuestionVisibilityEngine } from './services/question-visibility.engine';
import { DefaultProgressCalculationStrategy } from './services/progress-calculation.strategy';
import { BlueprintMigrationService } from './services/blueprint-migration.service';
import { OnboardingWorkflowEngine } from './services/onboarding-workflow.engine';
import { OnboardingAnalyticsService } from './services/onboarding-analytics.service';
import { OnboardingSessionService } from './services/onboarding-session.service';
import { QuestionDependencyEngineService } from './services/question-dependency-engine.service';
import { QuestionPrioritizationEngineService } from './services/question-prioritization-engine.service';
import { DocumentAwareQuestionEngineService } from './services/document-aware-question-engine.service';
import { AnswerProcessingEngineService } from './services/answer-processing-engine.service';
import { QuestionExplainabilityService } from './services/question-explainability.service';
import { OnboardingSessionEngineService } from './services/onboarding-session-engine.service';
import { AdaptiveQuestionEngineService } from './services/adaptive-question-engine.service';

import { OnboardingController } from './controllers/onboarding.controller';
import { AdaptiveOnboardingController } from './controllers/adaptive-onboarding.controller';

import { CitizenModule } from '../citizen/citizen.module';
import { DocumentModule } from '../document/document.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule, CitizenModule, DocumentModule],
  controllers: [OnboardingController, AdaptiveOnboardingController],
  providers: [
    QuestionDependencyEngineService,
    QuestionPrioritizationEngineService,
    DocumentAwareQuestionEngineService,
    AnswerProcessingEngineService,
    QuestionExplainabilityService,
    OnboardingSessionEngineService,
    AdaptiveQuestionEngineService,
    {
      provide: ONBOARDING_SESSION_REPOSITORY,
      useClass: PrismaOnboardingSessionRepository,
    },
    {
      provide: DISCOVERY_BLUEPRINT_REPOSITORY,
      useClass: PrismaDiscoveryBlueprintRepository,
    },
    {
      provide: QUESTION_CATALOG_REPOSITORY,
      useClass: PrismaQuestionCatalogRepository,
    },
    {
      provide: ONBOARDING_QUESTION_REPOSITORY,
      useClass: PrismaOnboardingQuestionRepository,
    },
    {
      provide: ANSWER_NORMALIZATION_ENGINE,
      useClass: AnswerNormalizationEngine,
    },
    {
      provide: QUESTION_VISIBILITY_ENGINE,
      useClass: QuestionVisibilityEngine,
    },
    {
      provide: PROGRESS_CALCULATION_STRATEGY,
      useClass: DefaultProgressCalculationStrategy,
    },
    {
      provide: BLUEPRINT_MIGRATION_SERVICE,
      useClass: BlueprintMigrationService,
    },
    {
      provide: ONBOARDING_WORKFLOW_ENGINE,
      useClass: OnboardingWorkflowEngine,
    },
    {
      provide: ONBOARDING_ANALYTICS_SERVICE,
      useClass: OnboardingAnalyticsService,
    },
    {
      provide: ONBOARDING_SESSION_SERVICE,
      useClass: OnboardingSessionService,
    },
    {
      provide: ADAPTIVE_QUESTION_ENGINE_SERVICE,
      useClass: AdaptiveQuestionEngineService,
    },
    {
      provide: QUESTION_DEPENDENCY_ENGINE_SERVICE,
      useClass: QuestionDependencyEngineService,
    },
    {
      provide: QUESTION_PRIORITIZATION_ENGINE_SERVICE,
      useClass: QuestionPrioritizationEngineService,
    },
    {
      provide: DOCUMENT_AWARE_QUESTION_ENGINE_SERVICE,
      useClass: DocumentAwareQuestionEngineService,
    },
    {
      provide: ANSWER_PROCESSING_ENGINE_SERVICE,
      useClass: AnswerProcessingEngineService,
    },
    {
      provide: QUESTION_EXPLAINABILITY_SERVICE,
      useClass: QuestionExplainabilityService,
    },
    {
      provide: ONBOARDING_SESSION_ENGINE_SERVICE,
      useClass: OnboardingSessionEngineService,
    },
  ],
  exports: [
    ONBOARDING_SESSION_SERVICE,
    ONBOARDING_QUESTION_REPOSITORY,
    ADAPTIVE_QUESTION_ENGINE_SERVICE,
    ANSWER_PROCESSING_ENGINE_SERVICE,
    QUESTION_EXPLAINABILITY_SERVICE,
    ONBOARDING_SESSION_ENGINE_SERVICE,
  ],
})
export class OnboardingModule {}
