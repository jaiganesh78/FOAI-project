import { describe, it, expect } from 'vitest';
import { PolicyNormalizationService } from '../../../src/modules/knowledge/services/policy-normalization.service';

describe('PolicyNormalizationService', () => {
  const service = new PolicyNormalizationService();

  it('should normalize amounts in Lakhs and state codes', () => {
    const norm = service.normalize({
      state: 'Tamil Nadu',
      beneficiaryCategory: 'FARMER',
      rawAmountText: 'Rs 2 Lakhs',
      extractionConfidence: 0.95,
      extractionMethod: 'REGEX',
      extractedBy: 'SYSTEM',
      sourceLocation: 'Title',
    });

    expect(norm.normalizedAmount).toBe(200000);
    expect(norm.normalizedStateCode).toBe('TN');
    expect(norm.normalizedCategoryCode).toBe('FARMER');
  });
});
