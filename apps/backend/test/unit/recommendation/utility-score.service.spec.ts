import { describe, it, expect } from 'vitest';
import { RecommendationUtilityService } from '../../../src/modules/recommendation/services/recommendation-utility.service';

describe('RecommendationUtilityService', () => {
  const service = new RecommendationUtilityService();

  it('should compute utility score breakdown with bonus for kisan policies', () => {
    const policy = { id: 'pol-1', title: 'PM Kisan Samman Nidhi', documentNumber: 'DOC-001' };
    const breakdown = service.computeUtilityScore(policy, { landHolding: 1.5 });

    expect(breakdown.finalUtilityScore).toBeGreaterThan(50);
    expect(breakdown.benefitScore).toBe(30);
  });
});
