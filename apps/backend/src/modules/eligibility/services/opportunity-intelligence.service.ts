import { Injectable } from '@nestjs/common';
import { OpportunityGapType } from '@gpios/shared';

export interface OpportunityResult {
  gapType: OpportunityGapType;
  description: string;
  requiredAction: string;
  potentialBenefitAmount?: number;
  gapValue?: Record<string, unknown>;
}

@Injectable()
export class OpportunityIntelligenceService {
  analyzeOpportunities(ineligiblePolicies: { title: string }[], citizenFacts: Record<string, unknown>): OpportunityResult | null {
    if (ineligiblePolicies.length === 0) return null;

    const income = Number(citizenFacts.annualIncome || 0);

    if (income > 200000 && income <= 250000) {
      const gap = income - 200000;
      return {
        gapType: OpportunityGapType.INCOME_THRESHOLD_EXCEEDED,
        description: `Annual income of ₹${income} exceeds the eligibility limit of ₹2,00,000 by ₹${gap}.`,
        requiredAction: 'File tax deductions or income revision proof to qualify for marginal benefit.',
        potentialBenefitAmount: 6000,
        gapValue: { gapAmount: gap, limit: 200000, actual: income },
      };
    }

    if (!citizenFacts.aadhaarNumber) {
      return {
        gapType: OpportunityGapType.MISSING_IDENTIFIER,
        description: 'Missing verified Aadhaar identifier required for official subsidy disbursement.',
        requiredAction: 'Upload or verify your Aadhaar card via DigiLocker to unlock eligible benefits.',
        potentialBenefitAmount: 10000,
        gapValue: { missingAttribute: 'aadhaarNumber' },
      };
    }

    return null;
  }
}
