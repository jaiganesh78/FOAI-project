export interface RecommendationGeneratedPayload {
  userId: string;
  recommendationId: string;
  snapshotId: string;
  portfolioId: string;
  itemCount: number;
  topPolicyId: string;
  executionDurationMs: number;
}

export interface RecommendationSnapshotCreatedPayload {
  userId: string;
  snapshotId: string;
  recommendationVersionId: string;
  strategyId: string;
  totalUtilityScore: number;
}

export interface RecommendationPreferenceUpdatedPayload {
  userId: string;
  preferenceId: string;
  categories: string[];
}
