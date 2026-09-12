import { describe, it, expect } from 'vitest';
import { OpportunityIntelligenceService } from '../../../src/modules/eligibility/services/opportunity-intelligence.service';
import { OpportunityGapType } from '@gpios/shared';

describe('OpportunityIntelligenceService', () => {
  const service = new OpportunityIntelligenceService();

  it('should detect income threshold exceeded opportunity gap', () => {
    const ineligiblePolicies = [{ title: 'State Welfare Scheme' }];
    const citizenFacts = { annualIncome: 210000, aadhaarNumber: '123456789012' };

    const opp = service.analyzeOpportunities(ineligiblePolicies, citizenFacts);

    expect(opp).not.toBeNull();
    expect(opp?.gapType).toBe(OpportunityGapType.INCOME_THRESHOLD_EXCEEDED);
    expect(opp?.potentialBenefitAmount).toBe(6000);
  });
});
