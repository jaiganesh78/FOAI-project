import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_SNAPSHOT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import {
  IRecommendationSnapshotRepository,
  RecommendationSnapshotWithDetails,
} from '../repositories/recommendation-snapshot.repository.interface';
import { createHash } from 'crypto';

@Injectable()
export class RecommendationSnapshotService {
  constructor(
    @Inject(RECOMMENDATION_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: IRecommendationSnapshotRepository,
  ) {}

  async createSnapshot(params: {
    userId: string;
    citizenSnapshotId: string;
    eligibilitySnapshotId: string;
    decisionTraceId: string;
    recommendationVersionId: string;
    portfolioId: string;
    strategyId: string;
    strategyVersion: string;
    utilityWeightConfiguration: Record<string, unknown>;
    rankingConfiguration: Record<string, unknown>;
    preferenceProfileVersion: number;
    portfolioOptimizationVersion: number;
  }): Promise<RecommendationSnapshotWithDetails> {
    const rawConfigStr = JSON.stringify({
      strategyId: params.strategyId,
      strategyVersion: params.strategyVersion,
      utility: params.utilityWeightConfiguration,
      ranking: params.rankingConfiguration,
      preferenceVer: params.preferenceProfileVersion,
      portfolioVer: params.portfolioOptimizationVersion,
    });

    const configurationChecksum = createHash('sha256').update(rawConfigStr).digest('hex');

    return this.snapshotRepository.createSnapshot({
      userId: params.userId,
      citizenSnapshotId: params.citizenSnapshotId,
      eligibilitySnapshotId: params.eligibilitySnapshotId,
      decisionTraceId: params.decisionTraceId,
      recommendationVersionId: params.recommendationVersionId,
      portfolioId: params.portfolioId,
      context: {
        strategyId: params.strategyId,
        strategyVersion: params.strategyVersion,
        utilityWeightConfiguration: params.utilityWeightConfiguration,
        rankingConfiguration: params.rankingConfiguration,
        preferenceProfileVersion: params.preferenceProfileVersion,
        portfolioOptimizationVersion: params.portfolioOptimizationVersion,
        generatorVersion: '1.0.0',
        configurationChecksum,
      },
    });
  }

  async getSnapshotById(id: string): Promise<RecommendationSnapshotWithDetails | null> {
    return this.snapshotRepository.findById(id);
  }

  async getSnapshotsByUserId(userId: string): Promise<RecommendationSnapshotWithDetails[]> {
    return this.snapshotRepository.findByUserId(userId);
  }
}
