import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IRecommendationSnapshotRepository,
  CreateRecommendationSnapshotData,
  RecommendationSnapshotWithDetails,
} from './recommendation-snapshot.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaRecommendationSnapshotRepository implements IRecommendationSnapshotRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RecommendationSnapshotWithDetails | null> {
    return this.prisma.recommendationSnapshot.findUnique({
      where: { id },
      include: { context: true, portfolio: true },
    }) as Promise<RecommendationSnapshotWithDetails | null>;
  }

  async findByUserId(userId: string): Promise<RecommendationSnapshotWithDetails[]> {
    return this.prisma.recommendationSnapshot.findMany({
      where: { userId },
      include: { context: true, portfolio: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<RecommendationSnapshotWithDetails[]>;
  }

  async findLatestByUserId(userId: string): Promise<RecommendationSnapshotWithDetails | null> {
    return this.prisma.recommendationSnapshot.findFirst({
      where: { userId },
      include: { context: true, portfolio: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<RecommendationSnapshotWithDetails | null>;
  }

  async createSnapshot(data: CreateRecommendationSnapshotData): Promise<RecommendationSnapshotWithDetails> {
    const contextRecord = await this.prisma.recommendationGenerationContext.create({
      data: {
        strategyId: data.context.strategyId,
        strategyVersion: data.context.strategyVersion,
        utilityWeightConfiguration: (data.context.utilityWeightConfiguration as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        rankingConfiguration: (data.context.rankingConfiguration as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        preferenceProfileVersion: data.context.preferenceProfileVersion,
        portfolioOptimizationVersion: data.context.portfolioOptimizationVersion,
        generatorVersion: data.context.generatorVersion,
        configurationChecksum: data.context.configurationChecksum,
      },
    });

    return (await this.prisma.recommendationSnapshot.create({
      data: {
        userId: data.userId,
        citizenSnapshotId: data.citizenSnapshotId,
        eligibilitySnapshotId: data.eligibilitySnapshotId,
        decisionTraceId: data.decisionTraceId,
        recommendationVersionId: data.recommendationVersionId,
        portfolioId: data.portfolioId,
        contextId: contextRecord.id,
      },
      include: { context: true, portfolio: true },
    })) as unknown as RecommendationSnapshotWithDetails;
  }
}
