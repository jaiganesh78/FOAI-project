import { describe, it, expect } from 'vitest';
import { RecommendationReplayService } from '../../../src/modules/recommendation/services/recommendation-replay.service';

describe('RecommendationReplayService', () => {
  const mockSnapshotRepo = {
    findById: async () => ({
      id: 'snap-1',
      portfolioId: 'port-1',
      context: { configurationChecksum: 'checksum123' },
    }),
  };

  const mockPortfolioRepo = {
    findById: async () => ({
      id: 'port-1',
      items: [{ policyId: 'pol-1' }],
    }),
  };

  const service = new RecommendationReplayService(mockSnapshotRepo as any, mockPortfolioRepo as any);

  it('should replay historical recommendation context and verify match', async () => {
    const replay = await service.replayRecommendation('snap-1');

    expect(replay.isMatch).toBe(true);
    expect(replay.originalPortfolioId).toBe('port-1');
  });
});
