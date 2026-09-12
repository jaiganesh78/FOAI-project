import { describe, it, expect } from 'vitest';
import { RecommendationDiffService } from '../../../src/modules/recommendation/services/recommendation-diff.service';
import { RecommendationChangeType } from '@gpios/shared';

describe('RecommendationDiffService', () => {
  const service = new RecommendationDiffService();

  it('should detect ADDED change when new policy is present in portfolio', () => {
    const oldItems: any[] = [];
    const newItems = [{ policyId: 'p-1', policyTitle: 'PM Kisan', rank: 1, utilityScore: 85 }];

    const diffs = service.computeDiff(oldItems, newItems);

    expect(diffs.length).toBe(1);
    expect(diffs[0].changeType).toBe(RecommendationChangeType.ADDED);
  });
});
