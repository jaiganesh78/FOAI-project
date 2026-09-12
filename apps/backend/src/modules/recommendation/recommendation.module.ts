import { Module } from '@nestjs/common';
import {
  RECOMMENDATION_REPOSITORY,
  RECOMMENDATION_PORTFOLIO_REPOSITORY,
  RECOMMENDATION_SNAPSHOT_REPOSITORY,
  RECOMMENDATION_FEEDBACK_REPOSITORY,
  RECOMMENDATION_STRATEGY_FACTORY,
  UTILITY_RECOMMENDATION_STRATEGY,
  RECOMMENDATION_UTILITY_SERVICE,
  APPLICATION_READINESS_SERVICE,
  RECOMMENDATION_DEPENDENCY_SERVICE,
  RECOMMENDATION_PORTFOLIO_OPTIMIZER,
  RECOMMENDATION_RANKING_SERVICE,
  RECOMMENDATION_EXPLAINABILITY_SERVICE,
  RECOMMENDATION_SNAPSHOT_SERVICE,
  RECOMMENDATION_REPLAY_SERVICE,
  RECOMMENDATION_DIFF_SERVICE,
  RECOMMENDATION_HISTORY_SERVICE,
  RECOMMENDATION_LIFECYCLE_SERVICE,
  RECOMMENDATION_PREFERENCE_SERVICE,
  RECOMMENDATION_FEEDBACK_SERVICE,
  RECOMMENDATION_ANALYTICS_SERVICE,
  RECOMMENDATION_GENERATION_SERVICE,
  RECOMMENDATION_QUERY_SERVICE,
} from '../../core/tokens/injection-tokens';

import { PrismaRecommendationRepository } from './repositories/prisma-recommendation.repository';
import { PrismaRecommendationPortfolioRepository } from './repositories/prisma-recommendation-portfolio.repository';
import { PrismaRecommendationSnapshotRepository } from './repositories/prisma-recommendation-snapshot.repository';
import { PrismaRecommendationFeedbackRepository } from './repositories/prisma-recommendation-feedback.repository';

import { UtilityRecommendationStrategy } from './strategies/utility-recommendation.strategy';
import { RecommendationStrategyFactory } from './strategies/recommendation-strategy.factory';

import { RecommendationUtilityService } from './services/recommendation-utility.service';
import { ApplicationReadinessService } from './services/application-readiness.service';
import { RecommendationDependencyService } from './services/recommendation-dependency.service';
import { RecommendationPortfolioOptimizer } from './services/recommendation-portfolio-optimizer.service';
import { RecommendationRankingService } from './services/recommendation-ranking.service';
import { RecommendationExplanationService } from './services/recommendation-explanation.service';
import { RecommendationSnapshotService } from './services/recommendation-snapshot.service';
import { RecommendationReplayService } from './services/recommendation-replay.service';
import { RecommendationDiffService } from './services/recommendation-diff.service';
import { RecommendationHistoryService } from './services/recommendation-history.service';
import { RecommendationLifecycleService } from './services/recommendation-lifecycle.service';
import { RecommendationPreferenceService } from './services/recommendation-preference.service';
import { RecommendationFeedbackService } from './services/recommendation-feedback.service';
import { RecommendationAnalyticsService } from './services/recommendation-analytics.service';
import { RecommendationGenerationService } from './services/recommendation-generation.service';
import { RecommendationQueryService } from './services/recommendation-query.service';

import { RecommendationController } from './controllers/recommendation.controller';
import { AuthModule } from '../auth/auth.module';
import { CitizenModule } from '../citizen/citizen.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { DatabaseModule } from '../../core/database/database.module';
import { EventBusModule } from '../../core/event-bus/event-bus.module';
import { ClockModule } from '../../core/clock/clock.module';

@Module({
  imports: [DatabaseModule, EventBusModule, ClockModule, AuthModule, CitizenModule, EligibilityModule],
  controllers: [RecommendationController],
  providers: [
    // Repositories
    { provide: RECOMMENDATION_REPOSITORY, useClass: PrismaRecommendationRepository },
    { provide: RECOMMENDATION_PORTFOLIO_REPOSITORY, useClass: PrismaRecommendationPortfolioRepository },
    { provide: RECOMMENDATION_SNAPSHOT_REPOSITORY, useClass: PrismaRecommendationSnapshotRepository },
    { provide: RECOMMENDATION_FEEDBACK_REPOSITORY, useClass: PrismaRecommendationFeedbackRepository },

    // Strategies
    { provide: UTILITY_RECOMMENDATION_STRATEGY, useClass: UtilityRecommendationStrategy },
    { provide: RECOMMENDATION_STRATEGY_FACTORY, useClass: RecommendationStrategyFactory },

    // Services & Engines
    { provide: RECOMMENDATION_UTILITY_SERVICE, useClass: RecommendationUtilityService },
    { provide: APPLICATION_READINESS_SERVICE, useClass: ApplicationReadinessService },
    { provide: RECOMMENDATION_DEPENDENCY_SERVICE, useClass: RecommendationDependencyService },
    { provide: RECOMMENDATION_PORTFOLIO_OPTIMIZER, useClass: RecommendationPortfolioOptimizer },
    { provide: RECOMMENDATION_RANKING_SERVICE, useClass: RecommendationRankingService },
    { provide: RECOMMENDATION_EXPLAINABILITY_SERVICE, useClass: RecommendationExplanationService },
    { provide: RECOMMENDATION_SNAPSHOT_SERVICE, useClass: RecommendationSnapshotService },
    { provide: RECOMMENDATION_REPLAY_SERVICE, useClass: RecommendationReplayService },
    { provide: RECOMMENDATION_DIFF_SERVICE, useClass: RecommendationDiffService },
    { provide: RECOMMENDATION_HISTORY_SERVICE, useClass: RecommendationHistoryService },
    { provide: RECOMMENDATION_LIFECYCLE_SERVICE, useClass: RecommendationLifecycleService },
    { provide: RECOMMENDATION_PREFERENCE_SERVICE, useClass: RecommendationPreferenceService },
    { provide: RECOMMENDATION_FEEDBACK_SERVICE, useClass: RecommendationFeedbackService },
    { provide: RECOMMENDATION_ANALYTICS_SERVICE, useClass: RecommendationAnalyticsService },
    { provide: RECOMMENDATION_GENERATION_SERVICE, useClass: RecommendationGenerationService },
    { provide: RECOMMENDATION_QUERY_SERVICE, useClass: RecommendationQueryService },
  ],
  exports: [
    RECOMMENDATION_GENERATION_SERVICE,
    RECOMMENDATION_QUERY_SERVICE,
    RECOMMENDATION_REPLAY_SERVICE,
    RECOMMENDATION_PREFERENCE_SERVICE,
  ],
})
export class RecommendationModule {}
