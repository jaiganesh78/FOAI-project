import { describe, it, expect } from 'vitest';
import { RecommendationPortfolioOptimizer } from '../../../src/modules/recommendation/services/recommendation-portfolio-optimizer.service';
import { RecommendationPriority } from '@gpios/shared';

describe('RecommendationPortfolioOptimizer', () => {
  const optimizer = new RecommendationPortfolioOptimizer();

  it('should deduplicate candidates and assign CRITICAL priority to rank 1', () => {
    const candidates = [
      { policyId: 'p-1', policyTitle: 'PM Kisan', policyNumber: 'DOC-1', utilityScore: 90, scoreBreakdown: {} },
      { policyId: 'p-1', policyTitle: 'PM Kisan', policyNumber: 'DOC-1', utilityScore: 90, scoreBreakdown: {} },
    ];

    const result = optimizer.optimizePortfolio(candidates as any);

    expect(result.items.length).toBe(1);
    expect(result.items[0].priority).toBe(RecommendationPriority.CRITICAL);
    expect(result.totalMonetaryValue).toBe(6000);
  });
});
