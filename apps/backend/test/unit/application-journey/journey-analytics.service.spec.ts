import { describe, it, expect } from 'vitest';
import { JourneyAnalyticsService } from '../../../src/modules/application-journey/services/journey-analytics.service';

describe('JourneyAnalyticsService', () => {
  const mockPrisma = {
    journeyAnalytics: {
      create: async (data: any) => ({ id: 1, ...data }),
      findFirst: async () => null,
    },
  };

  const service = new JourneyAnalyticsService(mockPrisma as any);

  it('should return default analytics if user analytics record does not exist', async () => {
    const analytics = await service.getLatestAnalytics('u-1');

    expect(analytics.blueprintReusePercent).toBe(85.0);
    expect(analytics.averageStepDurationMs).toBeGreaterThan(0);
  });
});
