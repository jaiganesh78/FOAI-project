import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_STRATEGY_FACTORY } from '../../../core/tokens/injection-tokens';
import { RecommendationStrategyFactory } from '../strategies/recommendation-strategy.factory';
import { ScoredPolicyCandidate } from '../strategies/recommendation-strategy.interface';

@Injectable()
export class RecommendationRankingService {
  constructor(
    @Inject(RECOMMENDATION_STRATEGY_FACTORY) private readonly strategyFactory: RecommendationStrategyFactory,
  ) {}

  async executeRankingPipeline(
    strategyId: string,
    eligiblePolicies: { id: string; title: string; documentNumber: string }[],
    citizenFacts: Record<string, unknown>,
    preferences?: { preferredCategories?: string[]; prioritizeMonetaryValue?: boolean; prioritizeUrgency?: boolean },
  ): Promise<ScoredPolicyCandidate[]> {
    const strategy = this.strategyFactory.getStrategy(strategyId);
    return strategy.rankCandidates(eligiblePolicies, citizenFacts, preferences);
  }
}
