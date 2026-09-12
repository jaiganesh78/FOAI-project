import { describe, it, expect } from 'vitest';
import { RecommendationPortfolioOptimizer } from '../../../src/modules/recommendation/services/recommendation-portfolio-optimizer.service';

describe('RecommendationPortfolio (Integration)', () => {
  const optimizer = new RecommendationPortfolioOptimizer();

  it('should optimize multiple candidates into a unified portfolio', () => {
    const candidates = [
      { policyId: 'pol-1', policyTitle: 'PM Kisan', policyNumber: 'DOC-1', utilityScore: 95, scoreBreakdown: {} },
      { policyId: 'pol-2', policyTitle: 'Scholarship', policyNumber: 'DOC-2', utilityScore: 70, scoreBreakdown: {} },
    ];

    const portfolio = optimizer.optimizePortfolio(candidates as any);

    expect(portfolio.items.length).toBe(2);
    expect(portfolio.totalMonetaryValue).toBe(16000);
  });
});
