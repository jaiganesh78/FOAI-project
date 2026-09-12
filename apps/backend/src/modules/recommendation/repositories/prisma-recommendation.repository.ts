import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IRecommendationRepository,
  CreateRecommendationData,
  RecommendationWithDetails,
} from './recommendation.repository.interface';
import { RecommendationLifecycleStatus, ApplicationReadinessStatus, Prisma } from '@prisma/client';

@Injectable()
export class PrismaRecommendationRepository implements IRecommendationRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RecommendationWithDetails | null> {
    return this.prisma.recommendation.findUnique({
      where: { id },
      include: {
        versions: {
          where: { isCurrent: true },
          include: { scoreBreakdown: true, explanations: true, readiness: true },
        },
      },
    }) as Promise<RecommendationWithDetails | null>;
  }

  async findByUserId(userId: string): Promise<RecommendationWithDetails[]> {
    return this.prisma.recommendation.findMany({
      where: { userId },
      include: {
        versions: {
          where: { isCurrent: true },
          include: { scoreBreakdown: true, explanations: true, readiness: true },
        },
      },
      orderBy: { rank: 'asc' },
    }) as Promise<RecommendationWithDetails[]>;
  }

  async createRecommendation(data: CreateRecommendationData): Promise<RecommendationWithDetails> {
    return this.prisma.recommendation.create({
      data: {
        userId: data.userId,
        policyId: data.policyId,
        rank: data.rank,
        status: data.status || 'ACTIVE',
        lifecycleStatus: data.lifecycleStatus || 'RECOMMENDED',
        utilityScore: data.utilityScore,
        versions: {
          create: [
            {
              versionNumber: 1,
              rank: data.rank,
              utilityScore: data.utilityScore,
              isCurrent: true,
              scoreBreakdown: {
                create: data.scoreBreakdown,
              },
              explanations: {
                create: [
                  {
                    policyId: data.explanation.policyId,
                    rank: data.explanation.rank,
                    primaryReason: data.explanation.primaryReason,
                    contributingFactors: data.explanation.contributingFactors as Prisma.InputJsonValue,
                    readinessNotice: data.explanation.readinessNotice,
                  },
                ],
              },
              readiness: {
                create: {
                  status: (data.readiness.status as ApplicationReadinessStatus) || ApplicationReadinessStatus.READY,
                  completionPercentage: data.readiness.completionPercentage,
                  missingFacts: data.readiness.missingFacts as Prisma.InputJsonValue,
                  missingDocuments: data.readiness.missingDocuments as Prisma.InputJsonValue,
                  verificationGaps: data.readiness.verificationGaps as Prisma.InputJsonValue,
                  expiredEvidence: data.readiness.expiredEvidence as Prisma.InputJsonValue,
                  missingOnboardingAnswers: data.readiness.missingOnboardingAnswers as Prisma.InputJsonValue,
                },
              },
            },
          ],
        },
      },
      include: {
        versions: {
          include: { scoreBreakdown: true, explanations: true, readiness: true },
        },
      },
    }) as Promise<RecommendationWithDetails>;
  }

  async updateLifecycleStatus(id: string, status: RecommendationLifecycleStatus): Promise<RecommendationWithDetails> {
    return this.prisma.recommendation.update({
      where: { id },
      data: { lifecycleStatus: status },
      include: {
        versions: {
          include: { scoreBreakdown: true, explanations: true, readiness: true },
        },
      },
    }) as Promise<RecommendationWithDetails>;
  }
}
