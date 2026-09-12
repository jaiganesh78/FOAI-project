import { describe, it, expect } from 'vitest';
import { RecommendationExplanationService } from '../../../src/modules/recommendation/services/recommendation-explanation.service';

describe('RecommendationExplanationService', () => {
  const service = new RecommendationExplanationService();

  it('should generate recommendation explanation with rank notice', () => {
    const explanation = service.generateExplanation(
      'pol-1',
      'PM Kisan',
      1,
      { benefitScore: 30, urgencyScore: 20, finalUtilityScore: 85 },
      'READY',
    );

    expect(explanation.rank).toBe(1);
    expect(explanation.readinessNotice).toContain('ready');
  });
});
