import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IRecommendationStrategy } from './recommendation-strategy.interface';
import { UTILITY_RECOMMENDATION_STRATEGY } from '../../../core/tokens/injection-tokens';

@Injectable()
export class RecommendationStrategyFactory {
  private readonly strategies = new Map<string, IRecommendationStrategy>();

  constructor(
    @Inject(UTILITY_RECOMMENDATION_STRATEGY) utilityStrategy: IRecommendationStrategy,
  ) {
    this.strategies.set(utilityStrategy.strategyId, utilityStrategy);
  }

  getStrategy(strategyId = 'UTILITY_DEFAULT'): IRecommendationStrategy {
    const strategy = this.strategies.get(strategyId) || this.strategies.get('UTILITY_DEFAULT');
    if (!strategy) {
      throw new NotFoundException(`Recommendation Strategy '${strategyId}' not found.`);
    }
    return strategy;
  }
}
