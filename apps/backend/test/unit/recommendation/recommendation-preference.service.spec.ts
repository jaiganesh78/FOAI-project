import { describe, it, expect } from 'vitest';
import { RecommendationPreferenceService } from '../../../src/modules/recommendation/services/recommendation-preference.service';

describe('RecommendationPreferenceService', () => {
  const mockPrisma = {
    recommendationPreference: {
      findUnique: async () => null,
      upsert: async (data: any) => data.create,
    },
  };

  const service = new RecommendationPreferenceService(mockPrisma as any);

  it('should return default preferences if user preference is not set', async () => {
    const pref = await service.getUserPreference('user-1');
    expect(pref.preferredCategories).toContain('AGRICULTURE');
  });
});
