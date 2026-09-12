import { RecommendationScoreBreakdownDto } from '@gpios/shared';

export interface ScoredPolicyCandidate {
  policyId: string;
  policyTitle: string;
  policyNumber: string;
  utilityScore: number;
  scoreBreakdown: RecommendationScoreBreakdownDto;
}

export interface IRecommendationStrategy {
  readonly strategyId: string;
  readonly version: string;

  rankCandidates(
    eligiblePolicies: { id: string; title: string; documentNumber: string }[],
    citizenFacts: Record<string, unknown>,
    preferences?: { preferredCategories?: string[]; prioritizeMonetaryValue?: boolean; prioritizeUrgency?: boolean },
  ): Promise<ScoredPolicyCandidate[]>;
}
