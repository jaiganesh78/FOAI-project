import { Inject, Injectable } from '@nestjs/common';
import { RECOMMENDATION_GENERATION_SERVICE, RECOMMENDATION_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { RecommendationGenerationService } from '../../recommendation/services/recommendation-generation.service';
import { RecommendationQueryService } from '../../recommendation/services/recommendation-query.service';
import { RecommendationSnapshotDto } from '@gpios/shared';

@Injectable()
export class RecommendationReEvaluationService {
  constructor(
    @Inject(RECOMMENDATION_GENERATION_SERVICE) private readonly generationService: RecommendationGenerationService,
    @Inject(RECOMMENDATION_QUERY_SERVICE) private readonly queryService: RecommendationQueryService,
  ) {}

  async getLatestState(userId: string): Promise<Record<string, unknown> | null> {
    const portfolio = await this.queryService.getRecommendationPortfolio(userId);
    return portfolio ? (portfolio as unknown as Record<string, unknown>) : null;
  }

  async execute(userId: string): Promise<RecommendationSnapshotDto> {
    return this.generationService.generateRecommendations(userId);
  }
}
