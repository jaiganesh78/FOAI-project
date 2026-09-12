import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IRecommendationRepository, RecommendationWithDetails } from '../repositories/recommendation.repository.interface';
import { RecommendationLifecycleStatus } from '@gpios/shared';

@Injectable()
export class RecommendationLifecycleService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY) private readonly recommendationRepo: IRecommendationRepository,
  ) {}

  async transitionStatus(recommendationId: string, targetStatus: RecommendationLifecycleStatus): Promise<RecommendationWithDetails> {
    return this.recommendationRepo.updateLifecycleStatus(recommendationId, targetStatus);
  }
}
