import { describe, it, expect } from 'vitest';
import { RecommendationRankingService } from '../../../src/modules/recommendation/services/recommendation-ranking.service';

describe('RecommendationRankingService', () => {
  const mockStrategy = {
    rankCandidates: async (policies: any[]) =>
      policies.map((p) => ({
        policyId: p.id,
        policyTitle: p.title,
        policyNumber: p.documentNumber,
        utilityScore: 85,
        scoreBreakdown: { benefitScore: 30, finalUtilityScore: 85 },
      })),
  };

  const mockFactory = {
    getStrategy: () => mockStrategy,
  };

  const service = new RecommendationRankingService(mockFactory as any);

  it('should execute ranking pipeline via strategy factory', async () => {
    const policies = [{ id: 'pol-1', title: 'PM Kisan', documentNumber: 'DOC-001' }];
    const res = await service.executeRankingPipeline('UTILITY_DEFAULT', policies, {});

    expect(res.length).toBe(1);
    expect(res[0].utilityScore).toBe(85);
  });
});
