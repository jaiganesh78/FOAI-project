import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  RECOMMENDATION_GENERATION_SERVICE,
  RECOMMENDATION_QUERY_SERVICE,
  RECOMMENDATION_PREFERENCE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { RecommendationGenerationService } from '../services/recommendation-generation.service';
import { RecommendationQueryService } from '../services/recommendation-query.service';
import { RecommendationPreferenceService } from '../services/recommendation-preference.service';
import {
  RecommendationDto,
  RecommendationPortfolioDto,
  RecommendationSnapshotDto,
  RecommendationAnalyticsDto,
  RecommendationDifferenceDto,
  RecommendationExplanationDto,
  ApplicationReadinessDto,
  RecommendationReplayResultDto,
  RecommendationPreferenceInputDto,
  RecommendationFeedbackInputDto,
} from '@gpios/shared';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(
    @Inject(RECOMMENDATION_GENERATION_SERVICE) private readonly generationService: RecommendationGenerationService,
    @Inject(RECOMMENDATION_QUERY_SERVICE) private readonly queryService: RecommendationQueryService,
    @Inject(RECOMMENDATION_PREFERENCE_SERVICE) private readonly preferenceService: RecommendationPreferenceService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateRecommendations(
    @CurrentUser() user: { userId: string },
    @Body() body?: { strategyId?: string },
  ): Promise<RecommendationSnapshotDto> {
    return this.generationService.generateRecommendations(user.userId, body?.strategyId || 'UTILITY_DEFAULT');
  }

  @Get()
  async getTopRecommendations(@CurrentUser() user: { userId: string }): Promise<RecommendationDto[]> {
    return this.queryService.getTopRecommendations(user.userId);
  }

  @Get('portfolio')
  async getPortfolio(@CurrentUser() user: { userId: string }): Promise<RecommendationPortfolioDto | null> {
    return this.queryService.getRecommendationPortfolio(user.userId);
  }

  @Get('snapshots')
  async getSnapshots(@CurrentUser() user: { userId: string }): Promise<RecommendationSnapshotDto[]> {
    return this.queryService.getRecommendationSnapshots(user.userId);
  }

  @Get('snapshots/:id')
  async getSnapshotById(@Param('id') id: string): Promise<RecommendationSnapshotDto> {
    return this.queryService.getRecommendationSnapshotById(id);
  }

  @Get('differences')
  async getDifferences(@CurrentUser() user: { userId: string }): Promise<RecommendationDifferenceDto[]> {
    return this.queryService.getRecommendationDifferences(user.userId);
  }

  @Get('explanations/:id')
  async getExplanation(@Param('id') id: string): Promise<RecommendationExplanationDto> {
    return this.queryService.getRecommendationExplanation(id);
  }

  @Get('readiness')
  async getReadiness(@CurrentUser() user: { userId: string }): Promise<ApplicationReadinessDto> {
    return this.queryService.getApplicationReadiness(user.userId);
  }

  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @CurrentUser() user: { userId: string },
    @Body() dto: RecommendationPreferenceInputDto,
  ) {
    return this.preferenceService.updateUserPreference(user.userId, dto);
  }

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async submitFeedback(
    @CurrentUser() user: { userId: string },
    @Body() dto: RecommendationFeedbackInputDto,
  ) {
    return this.queryService.submitFeedback(user.userId, dto);
  }

  @Post('replay/:id')
  @HttpCode(HttpStatus.OK)
  async replayRecommendation(@Param('id') id: string): Promise<RecommendationReplayResultDto> {
    return this.queryService.replayRecommendation(id);
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: { userId: string }): Promise<RecommendationAnalyticsDto> {
    return this.queryService.getAnalytics(user.userId);
  }

  @Get('health')
  async getHealth() {
    return {
      status: 'HEALTHY',
      engine: 'GPIOS Recommendation Intelligence Platform',
      version: '1.0.0',
      uptimeSec: process.uptime(),
    };
  }

  @Get(':id')
  async getRecommendationById(@Param('id') id: string): Promise<RecommendationDto> {
    return this.queryService.getRecommendationById(id);
  }
}
