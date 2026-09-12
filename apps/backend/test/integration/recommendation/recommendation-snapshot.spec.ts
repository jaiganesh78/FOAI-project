import { describe, it, expect } from 'vitest';
import { RecommendationSnapshotService } from '../../../src/modules/recommendation/services/recommendation-snapshot.service';

describe('RecommendationSnapshot (Integration)', () => {
  const mockRepo = {
    createSnapshot: async (data: any) => ({ id: 'snap-1', ...data }),
  };

  const service = new RecommendationSnapshotService(mockRepo as any);

  it('should compute configuration checksum when persisting context snapshot', async () => {
    const snapshot = await service.createSnapshot({
      userId: 'user-1',
      citizenSnapshotId: 'csnap-1',
      eligibilitySnapshotId: 'esnap-1',
      decisionTraceId: 'trace-1',
      recommendationVersionId: 'rver-1',
      portfolioId: 'port-1',
      strategyId: 'UTILITY_DEFAULT',
      strategyVersion: '1.0.0',
      utilityWeightConfiguration: { benefitWeight: 0.3 },
      rankingConfiguration: { sortOrder: 'DESC' },
      preferenceProfileVersion: 1,
      portfolioOptimizationVersion: 1,
    });

    expect(snapshot.context.configurationChecksum).toBeDefined();
    expect(snapshot.context.configurationChecksum.length).toBe(64); // SHA-256 hex length
  });
});
