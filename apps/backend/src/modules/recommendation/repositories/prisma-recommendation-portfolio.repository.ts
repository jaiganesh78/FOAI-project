import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IRecommendationPortfolioRepository,
  CreateRecommendationPortfolioData,
  RecommendationPortfolioWithItems,
} from './recommendation-portfolio.repository.interface';

@Injectable()
export class PrismaRecommendationPortfolioRepository implements IRecommendationPortfolioRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RecommendationPortfolioWithItems | null> {
    return this.prisma.recommendationPortfolio.findUnique({
      where: { id },
      include: { items: true },
    }) as Promise<RecommendationPortfolioWithItems | null>;
  }

  async findLatestByUserId(userId: string): Promise<RecommendationPortfolioWithItems | null> {
    return this.prisma.recommendationPortfolio.findFirst({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<RecommendationPortfolioWithItems | null>;
  }

  async createPortfolio(data: CreateRecommendationPortfolioData): Promise<RecommendationPortfolioWithItems> {
    return this.prisma.recommendationPortfolio.create({
      data: {
        userId: data.userId,
        snapshotId: data.snapshotId,
        totalMonetaryValue: data.totalMonetaryValue,
        itemCount: data.items.length,
        items: {
          create: data.items.map((item) => ({
            policyId: item.policyId,
            policyNumber: item.policyNumber,
            policyTitle: item.policyTitle,
            rank: item.rank,
            priority: item.priority,
            utilityScore: item.utilityScore,
          })),
        },
      },
      include: { items: true },
    }) as Promise<RecommendationPortfolioWithItems>;
  }
}
