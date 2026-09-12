import { RecommendationSnapshot, RecommendationGenerationContext, RecommendationPortfolio } from '@prisma/client';

export interface CreateRecommendationSnapshotData {
  userId: string;
  citizenSnapshotId: string;
  eligibilitySnapshotId: string;
  decisionTraceId: string;
  recommendationVersionId: string;
  portfolioId: string;
  context: {
    strategyId: string;
    strategyVersion: string;
    utilityWeightConfiguration: Record<string, unknown>;
    rankingConfiguration: Record<string, unknown>;
    preferenceProfileVersion: number;
    portfolioOptimizationVersion: number;
    generatorVersion: string;
    configurationChecksum: string;
  };
}

export interface RecommendationSnapshotWithDetails extends RecommendationSnapshot {
  context: RecommendationGenerationContext;
  portfolio: RecommendationPortfolio;
}

export interface IRecommendationSnapshotRepository {
  findById(id: string): Promise<RecommendationSnapshotWithDetails | null>;
  findByUserId(userId: string): Promise<RecommendationSnapshotWithDetails[]>;
  findLatestByUserId(userId: string): Promise<RecommendationSnapshotWithDetails | null>;
  createSnapshot(data: CreateRecommendationSnapshotData): Promise<RecommendationSnapshotWithDetails>;
}
