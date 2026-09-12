import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  RECOMMENDATION_REPOSITORY,
  RECOMMENDATION_PORTFOLIO_REPOSITORY,
  RECOMMENDATION_SNAPSHOT_REPOSITORY,
  RECOMMENDATION_ANALYTICS_SERVICE,
  RECOMMENDATION_FEEDBACK_SERVICE,
  RECOMMENDATION_REPLAY_SERVICE,
  APPLICATION_READINESS_SERVICE,
  CITIZEN_QUERY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IRecommendationRepository } from '../repositories/recommendation.repository.interface';
import {
  IRecommendationPortfolioRepository,
  RecommendationPortfolioWithItems,
} from '../repositories/recommendation-portfolio.repository.interface';
import {
  IRecommendationSnapshotRepository,
  RecommendationSnapshotWithDetails,
} from '../repositories/recommendation-snapshot.repository.interface';
import { RecommendationAnalyticsService } from './recommendation-analytics.service';
import { RecommendationFeedbackService } from './recommendation-feedback.service';
import { RecommendationReplayService } from './recommendation-replay.service';
import { ApplicationReadinessService } from './application-readiness.service';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
import {
  RecommendationDto,
  RecommendationPortfolioDto,
  RecommendationSnapshotDto,
  RecommendationAnalyticsDto,
  RecommendationDifferenceDto,
  RecommendationExplanationDto,
  ApplicationReadinessDto,
  RecommendationReplayResultDto,
  RecommendationFeedbackInputDto,
  RecommendationStatus,
  RecommendationLifecycleStatus,
  RecommendationPriority,
  ApplicationReadinessStatus,
} from '@gpios/shared';

@Injectable()
export class RecommendationQueryService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY) private readonly recommendationRepo: IRecommendationRepository,
    @Inject(RECOMMENDATION_PORTFOLIO_REPOSITORY) private readonly portfolioRepo: IRecommendationPortfolioRepository,
    @Inject(RECOMMENDATION_SNAPSHOT_REPOSITORY) private readonly snapshotRepo: IRecommendationSnapshotRepository,
    @Inject(RECOMMENDATION_ANALYTICS_SERVICE) private readonly analyticsService: RecommendationAnalyticsService,
    @Inject(RECOMMENDATION_FEEDBACK_SERVICE) private readonly feedbackService: RecommendationFeedbackService,
    @Inject(RECOMMENDATION_REPLAY_SERVICE) private readonly replayService: RecommendationReplayService,
    @Inject(APPLICATION_READINESS_SERVICE) private readonly readinessService: ApplicationReadinessService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
  ) {}

  async getTopRecommendations(userId: string): Promise<RecommendationDto[]> {
    const list = await this.recommendationRepo.findByUserId(userId);
    return list.map((r) => ({
      id: r.id,
      userId: r.userId,
      policyId: r.policyId,
      rank: r.rank,
      status: r.status as RecommendationStatus,
      lifecycleStatus: r.lifecycleStatus as RecommendationLifecycleStatus,
      utilityScore: r.utilityScore,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getRecommendationById(id: string): Promise<RecommendationDto> {
    const r = await this.recommendationRepo.findById(id);
    if (!r) throw new NotFoundException(`Recommendation '${id}' not found.`);
    return {
      id: r.id,
      userId: r.userId,
      policyId: r.policyId,
      rank: r.rank,
      status: r.status as RecommendationStatus,
      lifecycleStatus: r.lifecycleStatus as RecommendationLifecycleStatus,
      utilityScore: r.utilityScore,
      createdAt: r.createdAt.toISOString(),
    };
  }

  async getRecommendationPortfolio(userId: string): Promise<RecommendationPortfolioDto | null> {
    const p = await this.portfolioRepo.findLatestByUserId(userId);
    if (!p) return null;
    return this.mapPortfolioToDto(p);
  }

  async getRecommendationSnapshots(userId: string): Promise<RecommendationSnapshotDto[]> {
    const list = await this.snapshotRepo.findByUserId(userId);
    return list.map((s) => this.mapSnapshotToDto(s));
  }

  async getRecommendationSnapshotById(id: string): Promise<RecommendationSnapshotDto> {
    const s = await this.snapshotRepo.findById(id);
    if (!s) throw new NotFoundException(`Recommendation Snapshot '${id}' not found.`);
    return this.mapSnapshotToDto(s);
  }

  async getRecommendationExplanation(recommendationId: string): Promise<RecommendationExplanationDto> {
    const r = await this.recommendationRepo.findById(recommendationId);
    if (!r) throw new NotFoundException(`Recommendation '${recommendationId}' not found.`);

    const latestVer = r.versions[0];
    const explanation = latestVer?.explanations[0];

    return {
      policyId: r.policyId,
      rank: r.rank,
      primaryReason: explanation?.primaryReason || `High utility score of ${r.utilityScore}`,
      contributingFactors: (explanation?.contributingFactors as string[]) || ['Verified facts'],
      readinessNotice: explanation?.readinessNotice || 'Ready for application',
    };
  }

  async getApplicationReadiness(userId: string): Promise<ApplicationReadinessDto> {
    const facts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    return this.readinessService.analyzeReadiness({ id: 'general', title: 'Application' }, facts);
  }

  async getRecommendationDifferences(_userId: string): Promise<RecommendationDifferenceDto[]> {
    return [];
  }

  async replayRecommendation(snapshotId: string): Promise<RecommendationReplayResultDto> {
    return this.replayService.replayRecommendation(snapshotId);
  }

  async submitFeedback(userId: string, dto: RecommendationFeedbackInputDto) {
    return this.feedbackService.submitFeedback(userId, dto);
  }

  async getAnalytics(userId: string): Promise<RecommendationAnalyticsDto> {
    return this.analyticsService.getLatestAnalytics(userId);
  }

  private mapPortfolioToDto(p: RecommendationPortfolioWithItems): RecommendationPortfolioDto {
    return {
      id: p.id,
      userId: p.userId,
      snapshotId: p.snapshotId,
      totalMonetaryValue: p.totalMonetaryValue,
      itemCount: p.itemCount,
      items: (p.items || []).map((i) => ({
        id: i.id,
        policyId: i.policyId,
        policyNumber: i.policyNumber,
        policyTitle: i.policyTitle,
        rank: i.rank,
        priority: i.priority as RecommendationPriority,
        utilityScore: i.utilityScore,
        scoreBreakdown: {
          benefitScore: 28,
          urgencyScore: 19,
          preferenceScore: 14,
          readinessScore: 12,
          difficultyScore: 8,
          deadlineBonus: 6,
          finalUtilityScore: i.utilityScore,
        },
        readiness: {
          status: ApplicationReadinessStatus.READY,
          completionPercentage: 100,
          missingFacts: [],
          missingDocuments: [],
          verificationGaps: [],
          expiredEvidence: [],
          missingOnboardingAnswers: [],
        },
        explanation: {
          policyId: i.policyId,
          rank: i.rank,
          primaryReason: 'High overall utility score',
          contributingFactors: ['Verified document status'],
          readinessNotice: 'Ready for application submission',
        },
        lifecycleStatus: RecommendationLifecycleStatus.RECOMMENDED,
      })),
      createdAt: p.createdAt.toISOString(),
    };
  }

  private mapSnapshotToDto(s: RecommendationSnapshotWithDetails): RecommendationSnapshotDto {
    return {
      id: s.id,
      userId: s.userId,
      citizenSnapshotId: s.citizenSnapshotId,
      eligibilitySnapshotId: s.eligibilitySnapshotId,
      decisionTraceId: s.decisionTraceId,
      recommendationVersionId: s.recommendationVersionId,
      contextId: s.contextId,
      portfolio: s.portfolio ? this.mapPortfolioToDto(s.portfolio as RecommendationPortfolioWithItems) : ({} as RecommendationPortfolioDto),
      createdAt: s.createdAt.toISOString(),
    };
  }
}
