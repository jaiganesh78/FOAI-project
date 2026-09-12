import { describe, it, expect } from 'vitest';
import { BenefitIntelligenceService } from '../../../src/modules/eligibility/services/benefit-intelligence.service';

describe('BenefitIntelligenceService', () => {
  const service = new BenefitIntelligenceService();

  it('should calculate total monetary value and recurring monthly value for eligible policies', () => {
    const policies = [{ title: 'PM Kisan Samman Nidhi' }];
    const res = service.calculateBenefits(policies);

    expect(res.totalMonetaryValue).toBe(6000);
    expect(res.recurringMonthlyValue).toBe(500);
    expect(res.urgencyLevel).toBe('HIGH');
  });
});
