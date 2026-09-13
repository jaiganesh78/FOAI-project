import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from './core/config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { DatabaseModule } from './core/database/database.module';
import { RedisModule } from './core/redis/redis.module';
import { EventBusModule } from './core/event-bus/event-bus.module';
import { StorageModule } from './core/storage/storage.module';
import { AIProviderModule } from './core/ai-provider/ai-provider.module';
import { ClockModule } from './core/clock/clock.module';
import { FeatureFlagModule } from './core/feature-flag/feature-flag.module';
import { TelemetryModule } from './core/telemetry/telemetry.module';
import { HealthModule } from './core/health/health.module';
import { SemanticModule } from './core/semantic/semantic.module';
import { CorrelationMiddleware } from './core/logger/correlation.middleware';

// IAM Module
import { AuthModule } from './modules/auth/auth.module';

// Domain Modules
import { CitizenModule } from './modules/citizen/citizen.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { PolicyModule } from './modules/policy/policy.module';
import { EligibilityModule } from './modules/eligibility/eligibility.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ApplicationJourneyModule } from './modules/application-journey/application-journey.module';
import { DocumentModule } from './modules/document/document.module';
import { FactVerificationModule } from './modules/fact-verification/fact-verification.module';
import { DecisionReEvaluationModule } from './modules/decision-re-evaluation/decision-re-evaluation.module';
import { AIModule } from './modules/ai/ai.module';
import { CompanionModule } from './modules/companion/companion.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CandidateRetrievalModule } from './modules/candidate-retrieval/candidate-retrieval.module';

@Module({
  imports: [
    // Core Infrastructure Modules
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    RedisModule,
    EventBusModule,
    StorageModule,
    AIProviderModule,
    ClockModule,
    FeatureFlagModule,
    TelemetryModule,
    HealthModule,
    SemanticModule,

    // Identity & Access Management (IAM) Module
    AuthModule,

    // Domain Modules
    CitizenModule,
    OnboardingModule,
    KnowledgeModule,
    PolicyModule,
    EligibilityModule,
    RecommendationModule,
    ApplicationJourneyModule,
    DocumentModule,
    FactVerificationModule,
    DecisionReEvaluationModule,
    AIModule,
    CompanionModule,
    CopilotModule,
    AdminModule,
    NotificationModule,
    CandidateRetrievalModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
