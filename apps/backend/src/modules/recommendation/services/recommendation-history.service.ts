import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { RecommendationHistory, Prisma } from '@prisma/client';

@Injectable()
export class RecommendationHistoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordHistory(userId: string, recommendationId: string, action: string, details?: Record<string, unknown>): Promise<void> {
    await this.prisma.recommendationHistory.create({
      data: {
        userId,
        recommendationId,
        action,
        details: (details as Prisma.InputJsonValue) || {},
      },
    });
  }

  async getHistoryByUserId(userId: string): Promise<RecommendationHistory[]> {
    return this.prisma.recommendationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
