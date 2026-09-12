import { describe, it, expect } from 'vitest';
import { RecommendationGenerationService } from '../../../src/modules/recommendation/services/recommendation-generation.service';
import { RecommendationRankingService } from '../../../src/modules/recommendation/services/recommendation-ranking.service';
import { ApplicationReadinessService } from '../../../src/modules/recommendation/services/application-readiness.service';
import { RecommendationPortfolioOptimizer } from '../../../src/modules/recommendation/services/recommendation-portfolio-optimizer.service';
import { RecommendationExplanationService } from '../../../src/modules/recommendation/services/recommendation-explanation.service';
import { RecommendationSnapshotService } from '../../../src/modules/recommendation/services/recommendation-snapshot.service';
import { RecommendationDiffService } from '../../../src/modules/recommendation/services/recommendation-diff.service';
import { RecommendationAnalyticsService } from '../../../src/modules/recommendation/services/recommendation-analytics.service';
import { RecommendationUtilityService } from '../../../src/modules/recommendation/services/recommendation-utility.service';
import { UtilityRecommendationStrategy } from '../../../src/modules/recommendation/strategies/utility-recommendation.strategy';
import { RecommendationStrategyFactory } from '../../../src/modules/recommendation/strategies/recommendation-strategy.factory';

describe('RecommendationGenerationService (Integration)', () => {
  const mockEligibilityQuery = {
    getLatestSnapshot: async () => ({
      id: 'elig-snap-1',
      citizenSnapshotId: 'csnap-1',
      decisionTraceId: 'trace-1',
      results: [
        { status: 'ELIGIBLE', policyId: 'pol-1', policyTitle: 'PM Kisan Samman Nidhi', policyNumber: 'DOC-001' },
      ],
    }),
  };

  const mockCitizenQuery = {
    getStructuredFactsByUserId: async () => ({ landHolding: 1.5, bankAccountNumber: '1234' }),
  };

  const mockRecRepo = {
    createRecommendation: async (r: any) => ({ id: 'rec-1', ...r }),
  };

  const mockPortfolioRepo = {
    findLatestByUserId: async () => null,
    createPortfolio: async (p: any) => ({ id: 'port-1', ...p, createdAt: new Date() }),
  };

  const mockPrefService = {
    getUserPreference: async () => ({ preferredCategories: ['AGRICULTURE'] }),
  };

  const mockSnapshotRepo = {
    createSnapshot: async (s: any) => ({ id: 'snap-1', ...s, createdAt: new Date() }),
  };

  const mockAnalyticsPrisma = {
    recommendationAnalytics: { create: async () => {} },
  };

  const utilityService = new RecommendationUtilityService();
  const utilityStrategy = new UtilityRecommendationStrategy(utilityService);
  const factory = new RecommendationStrategyFactory(utilityStrategy);

  const rankingService = new RecommendationRankingService(factory);
  const readinessService = new ApplicationReadinessService();
  const optimizer = new RecommendationPortfolioOptimizer();
  const explanationService = new RecommendationExplanationService();
  const snapshotService = new RecommendationSnapshotService(mockSnapshotRepo as any);
  const diffService = new RecommendationDiffService();
  const analyticsService = new RecommendationAnalyticsService(mockAnalyticsPrisma as any);
  const eventPublisher = { publish: async () => {} };
  const clock = { now: () => new Date() };

  const generationService = new RecommendationGenerationService(
    mockEligibilityQuery as any,
    mockCitizenQuery as any,
    mockRecRepo as any,
    mockPortfolioRepo as any,
    mockPrefService as any,
    rankingService,
    readinessService,
    optimizer,
    explanationService,
    snapshotService,
    diffService,
    analyticsService,
    eventPublisher as any,
    clock as any,
  );

  it('should orchestrate complete recommendation generation pipeline and produce snapshot', async () => {
    const snapshot = await generationService.generateRecommendations('user-101');

    expect(snapshot.userId).toBe('user-101');
    expect(snapshot.portfolio.items.length).toBe(1);
    expect(snapshot.portfolio.totalMonetaryValue).toBe(6000);
  });
});
