import { Inject, Injectable } from '@nestjs/common';
import { IRecommendationStrategy, ScoredPolicyCandidate } from './recommendation-strategy.interface';
import { RECOMMENDATION_UTILITY_SERVICE } from '../../../core/tokens/injection-tokens';
import { RecommendationUtilityService } from '../services/recommendation-utility.service';

@Injectable()
export class UtilityRecommendationStrategy implements IRecommendationStrategy {
  readonly strategyId = 'UTILITY_DEFAULT';
  readonly version = '1.0.0';

  constructor(
    @Inject(RECOMMENDATION_UTILITY_SERVICE) private readonly utilityService: RecommendationUtilityService,
  ) {}

  async rankCandidates(
    eligiblePolicies: { id: string; title: string; documentNumber: string }[],
    citizenFacts: Record<string, unknown>,
    preferences?: { preferredCategories?: string[]; prioritizeMonetaryValue?: boolean; prioritizeUrgency?: boolean },
  ): Promise<ScoredPolicyCandidate[]> {
    const candidates: ScoredPolicyCandidate[] = [];

    for (const pol of eligiblePolicies) {
      const scoreBreakdown = this.utilityService.computeUtilityScore(pol, citizenFacts, preferences);
      candidates.push({
        policyId: pol.id,
        policyTitle: pol.title,
        policyNumber: pol.documentNumber,
        utilityScore: scoreBreakdown.finalUtilityScore,
        scoreBreakdown,
      });
    }

    // Sort descending by final utility score
    return candidates.sort((a, b) => b.utilityScore - a.utilityScore);
  }
}
