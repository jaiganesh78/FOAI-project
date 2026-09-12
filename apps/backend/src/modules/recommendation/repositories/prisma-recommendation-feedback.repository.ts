import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IRecommendationFeedbackRepository,
  CreateRecommendationFeedbackData,
} from './recommendation-feedback.repository.interface';
import { RecommendationFeedback, Prisma } from '@prisma/client';

@Injectable()
export class PrismaRecommendationFeedbackRepository implements IRecommendationFeedbackRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createFeedback(data: CreateRecommendationFeedbackData): Promise<RecommendationFeedback> {
    return this.prisma.recommendationFeedback.create({
      data: {
        recommendationId: data.recommendationId,
        userId: data.userId,
        action: data.action,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async findByUserId(userId: string): Promise<RecommendationFeedback[]> {
    return this.prisma.recommendationFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
