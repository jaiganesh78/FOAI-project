import { describe, it, expect } from 'vitest';
import { RecommendationLifecycleService } from '../../../src/modules/recommendation/services/recommendation-lifecycle.service';
import { RecommendationLifecycleStatus } from '@gpios/shared';

describe('RecommendationLifecycleService', () => {
  const mockRepo = {
    updateLifecycleStatus: async (id: string, status: any) => ({ id, lifecycleStatus: status }),
  };

  const service = new RecommendationLifecycleService(mockRepo as any);

  it('should transition recommendation lifecycle status', async () => {
    const res = await service.transitionStatus('rec-1', RecommendationLifecycleStatus.SAVED);
    expect(res.lifecycleStatus).toBe(RecommendationLifecycleStatus.SAVED);
  });
});
