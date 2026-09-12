import {
  Recommendation,
  RecommendationVersion,
  RecommendationScoreBreakdown,
  RecommendationExplanation,
  ApplicationReadiness,
  RecommendationStatus,
  RecommendationLifecycleStatus,
} from '@prisma/client';

export interface RecommendationWithDetails extends Recommendation {
  versions: (RecommendationVersion & {
    scoreBreakdown: RecommendationScoreBreakdown | null;
    explanations: RecommendationExplanation[];
    readiness: ApplicationReadiness | null;
  })[];
}

export interface CreateRecommendationData {
  userId: string;
  policyId: string;
  rank: number;
  status?: RecommendationStatus;
  lifecycleStatus?: RecommendationLifecycleStatus;
  utilityScore: number;
  scoreBreakdown: {
    benefitScore: number;
    urgencyScore: number;
    preferenceScore: number;
    readinessScore: number;
    difficultyScore: number;
    deadlineBonus: number;
    finalUtilityScore: number;
  };
  explanation: {
    policyId: string;
    rank: number;
    primaryReason: string;
    contributingFactors: string[];
    readinessNotice: string;
  };
  readiness: {
    status: string;
    completionPercentage: number;
    missingFacts: string[];
    missingDocuments: string[];
    verificationGaps: string[];
    expiredEvidence: string[];
    missingOnboardingAnswers: string[];
  };
}

export interface IRecommendationRepository {
  findById(id: string): Promise<RecommendationWithDetails | null>;
  findByUserId(userId: string): Promise<RecommendationWithDetails[]>;
  createRecommendation(data: CreateRecommendationData): Promise<RecommendationWithDetails>;
  updateLifecycleStatus(id: string, status: RecommendationLifecycleStatus): Promise<RecommendationWithDetails>;
}
