import { describe, it, expect } from 'vitest';
import { RecommendationDiffService } from '../../../src/modules/recommendation/services/recommendation-diff.service';

describe('RecommendationVersioning (Integration)', () => {
  const diffService = new RecommendationDiffService();

  it('should detect version diffs when rank changes between generations', () => {
    const oldPortfolio = [{ policyId: 'pol-1', policyTitle: 'PM Kisan', rank: 1, utilityScore: 90 }];
    const newPortfolio = [{ policyId: 'pol-1', policyTitle: 'PM Kisan', rank: 2, utilityScore: 80 }];

    const diffs = diffService.computeDiff(oldPortfolio, newPortfolio);

    expect(diffs.length).toBe(1);
    expect(diffs[0].oldRank).toBe(1);
    expect(diffs[0].newRank).toBe(2);
  });
});
