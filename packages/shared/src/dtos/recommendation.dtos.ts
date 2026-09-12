import {
  RecommendationStatus,
  RecommendationPriority,
  RecommendationLifecycleStatus,
  ApplicationReadinessStatus,
  RecommendationChangeType,
  RecommendationFeedbackAction,
} from '../enums/recommendation.enum';

export interface RecommendationScoreBreakdownDto {
  benefitScore: number;
  urgencyScore: number;
  preferenceScore: number;
  readinessScore: number;
  difficultyScore: number;
  deadlineBonus: number;
  finalUtilityScore: number;
}

export interface ApplicationReadinessDto {
  status: ApplicationReadinessStatus;
  completionPercentage: number;
  missingFacts: string[];
  missingDocuments: string[];
  verificationGaps: string[];
  expiredEvidence: string[];
  missingOnboardingAnswers: string[];
}

export interface RecommendationExplanationDto {
  policyId: string;
  rank: number;
  primaryReason: string;
  contributingFactors: string[];
  readinessNotice: string;
}

export interface RecommendationPortfolioItemDto {
  id: string;
  policyId: string;
  policyNumber: string;
  policyTitle: string;
  rank: number;
  priority: RecommendationPriority;
  utilityScore: number;
  scoreBreakdown: RecommendationScoreBreakdownDto;
  readiness: ApplicationReadinessDto;
  explanation: RecommendationExplanationDto;
  lifecycleStatus: RecommendationLifecycleStatus;
}

export interface RecommendationPortfolioDto {
  id: string;
  userId: string;
  snapshotId: string;
  totalMonetaryValue: number;
  itemCount: number;
  items: RecommendationPortfolioItemDto[];
  createdAt: string;
}

export interface RecommendationDto {
  id: string;
  userId: string;
  policyId: string;
  rank: number;
  status: RecommendationStatus;
  lifecycleStatus: RecommendationLifecycleStatus;
  utilityScore: number;
  createdAt: string;
}

export interface RecommendationSnapshotDto {
  id: string;
  userId: string;
  citizenSnapshotId: string;
  eligibilitySnapshotId: string;
  decisionTraceId: string;
  recommendationVersionId: string;
  contextId: string;
  portfolio: RecommendationPortfolioDto;
  createdAt: string;
}

export interface RecommendationDifferenceDto {
  changeType: RecommendationChangeType;
  policyId: string;
  policyTitle: string;
  oldRank?: number;
  newRank?: number;
  oldUtilityScore?: number;
  newUtilityScore?: number;
  details: string;
}

export interface RecommendationAnalyticsDto {
  averageRankingTimeMs: number;
  portfolioOptimizationTimeMs: number;
  explanationGenerationTimeMs: number;
  snapshotCreationTimeMs: number;
  recommendationDiffTimeMs: number;
  averageRecommendationScore: number;
  averageBenefitValue: number;
  averageApplicationReadinessPercent: number;
  averagePortfolioSize: number;
  topRecommendedSchemes: string[];
  recommendationFailureRate: number;
}

export interface RecommendationPreferenceInputDto {
  preferredCategories: string[];
  maxDifficultyTolerance?: number;
  prioritizeMonetaryValue?: boolean;
  prioritizeUrgency?: boolean;
}

export interface RecommendationFeedbackInputDto {
  recommendationId: string;
  action: RecommendationFeedbackAction;
  metadata?: Record<string, unknown>;
}

export interface RecommendationReplayResultDto {
  snapshotId: string;
  originalPortfolioId: string;
  replayedPortfolioId: string;
  isMatch: boolean;
  replayExecutionTimeMs: number;
  driftDetails?: string[];
}
