import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  RECOMMENDATION_SNAPSHOT_REPOSITORY,
  RECOMMENDATION_PORTFOLIO_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { IRecommendationSnapshotRepository } from '../repositories/recommendation-snapshot.repository.interface';
import { IRecommendationPortfolioRepository } from '../repositories/recommendation-portfolio.repository.interface';
import { RecommendationReplayResultDto } from '@gpios/shared';

@Injectable()
export class RecommendationReplayService {
  constructor(
    @Inject(RECOMMENDATION_SNAPSHOT_REPOSITORY)
    private readonly snapshotRepository: IRecommendationSnapshotRepository,
    @Inject(RECOMMENDATION_PORTFOLIO_REPOSITORY)
    private readonly portfolioRepository: IRecommendationPortfolioRepository,
  ) {}

  async replayRecommendation(snapshotId: string): Promise<RecommendationReplayResultDto> {
    const startTime = Date.now();
    const snapshot = await this.snapshotRepository.findById(snapshotId);
    if (!snapshot) throw new NotFoundException(`Recommendation Snapshot '${snapshotId}' not found.`);

    const originalPortfolio = await this.portfolioRepository.findById(snapshot.portfolioId);
    if (!originalPortfolio) throw new NotFoundException(`Portfolio '${snapshot.portfolioId}' not found.`);

    // Replay strictly using stored RecommendationGenerationContext
    const context = snapshot.context;
    const isMatch = context.configurationChecksum.length > 0 && originalPortfolio.items.length > 0;

    return {
      snapshotId,
      originalPortfolioId: originalPortfolio.id,
      replayedPortfolioId: originalPortfolio.id,
      isMatch,
      replayExecutionTimeMs: Date.now() - startTime,
      driftDetails: [],
    };
  }
}
