import { RecommendationFeedback, RecommendationFeedbackAction } from '@prisma/client';

export interface CreateRecommendationFeedbackData {
  recommendationId: string;
  userId: string;
  action: RecommendationFeedbackAction;
  metadata?: Record<string, unknown>;
}

export interface IRecommendationFeedbackRepository {
  createFeedback(data: CreateRecommendationFeedbackData): Promise<RecommendationFeedback>;
  findByUserId(userId: string): Promise<RecommendationFeedback[]>;
}
