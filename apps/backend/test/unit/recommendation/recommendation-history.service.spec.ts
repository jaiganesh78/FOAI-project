import { describe, it, expect } from 'vitest';
import { RecommendationHistoryService } from '../../../src/modules/recommendation/services/recommendation-history.service';

describe('RecommendationHistoryService', () => {
  const mockPrisma = {
    recommendationHistory: {
      create: async (data: any) => ({ id: 'h-1', ...data }),
      findMany: async () => [{ id: 'h-1', userId: 'user-1' }],
    },
  };

  const service = new RecommendationHistoryService(mockPrisma as any);

  it('should record recommendation action history', async () => {
    await service.recordHistory('user-1', 'rec-1', 'VIEWED');
    const history = await service.getHistoryByUserId('user-1');

    expect(history.length).toBe(1);
  });
});
