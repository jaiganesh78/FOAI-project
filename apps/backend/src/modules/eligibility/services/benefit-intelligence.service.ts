import { Injectable } from '@nestjs/common';

export interface BenefitAnalysisResult {
  totalMonetaryValue: number;
  recurringMonthlyValue: number;
  oneTimeGrantValue: number;
  urgencyLevel: string;
  applicationDeadline?: Date;
}

@Injectable()
export class BenefitIntelligenceService {
  calculateBenefits(eligiblePolicies: { title: string }[]): BenefitAnalysisResult {
    let totalMonetaryValue = 0;
    let recurringMonthlyValue = 0;
    let oneTimeGrantValue = 0;

    for (const pol of eligiblePolicies) {
      if (pol.title.toLowerCase().includes('kisan')) {
        totalMonetaryValue += 6000;
        recurringMonthlyValue += 500;
      } else if (pol.title.toLowerCase().includes('grant') || pol.title.toLowerCase().includes('scholarship')) {
        totalMonetaryValue += 200000;
        oneTimeGrantValue += 200000;
      } else {
        totalMonetaryValue += 10000;
      }
    }

    return {
      totalMonetaryValue,
      recurringMonthlyValue,
      oneTimeGrantValue,
      urgencyLevel: eligiblePolicies.length > 0 ? 'HIGH' : 'LOW',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days deadline
    };
  }
}
