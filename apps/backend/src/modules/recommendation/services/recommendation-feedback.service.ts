import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_FEEDBACK_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IRecommendationFeedbackRepository } from '../repositories/recommendation-feedback.repository.interface';
import { RecommendationFeedbackInputDto, RecommendationFeedbackAction } from '@gpios/shared';

@Injectable()
export class RecommendationFeedbackService {
  constructor(
    @Inject(RECOMMENDATION_FEEDBACK_REPOSITORY) private readonly feedbackRepo: IRecommendationFeedbackRepository,
  ) {}

  async submitFeedback(userId: string, dto: RecommendationFeedbackInputDto) {
    return this.feedbackRepo.createFeedback({
      userId,
      recommendationId: dto.recommendationId,
      action: dto.action as RecommendationFeedbackAction,
      metadata: dto.metadata,
    });
  }

  async getFeedbackByUserId(userId: string) {
    return this.feedbackRepo.findByUserId(userId);
  }
}
