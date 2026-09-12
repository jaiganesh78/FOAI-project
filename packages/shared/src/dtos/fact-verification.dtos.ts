import {
  FactConflictCategory,
  ConflictSeverity,
  ReconciliationStrategy,
  ManualReviewStatus,
  FactFreshnessStatus,
} from '../enums';

export interface VerifyFactRequestDto {
  factId: string;
  idempotencyKey: string;
}

export interface CanonicalFactResolutionDto {
  resolutionId: string;
  verificationRunId: string;
  factId: string;
  attributeKey: string;
  winningValue: unknown;
  winningSource: string;
  winningSourcePrecedence: number;
  losingValues: Array<{ source: string; value: unknown; precedence: number }>;
  strategy: ReconciliationStrategy;
  resolutionReason: string;
  policyId: string;
  policyVersion: number;
  policyChecksumSha256: string;
  resolvedAt: string;
  resolvedBy: string;
}

export interface FactConflictDetailDto {
  conflictId: string;
  citizenId: string;
  factId: string;
  attributeKey: string;
  category: FactConflictCategory;
  severity: ConflictSeverity;
  competingValues: Array<{ source: string; value: unknown }>;
  evidenceReferences: string[];
  status: string;
  detectedAt: string;
  resolutionStrategy?: ReconciliationStrategy;
  resolvedAt?: string;
  resolvedBy?: string;
  policyVersion: number;
}

export interface EvidenceChainValidationDto {
  factId: string;
  isValidChain: boolean;
  provenanceExists: boolean;
  documentStatus: string;
  documentVerificationStatus: string;
  trustScore: number;
  isFresh: boolean;
  hasBlockingConflict: boolean;
  validationFailureReason?: string;
}

export interface FactVerificationPolicyDto {
  policyId: string;
  attributeKey: string;
  version: number;
  acceptableSources: string[];
  minimumTrustScore: number;
  freshnessExpiryDurationDays: number;
  requireManualReviewForGovernmentExpired: boolean;
  requireManualReviewForConflicts: boolean;
  checksumSha256: string;
  isActive: boolean;
}

export interface FactVerificationReviewDto {
  reviewId: string;
  conflictId: string;
  citizenId: string;
  attributeKey: string;
  priority: number;
  reason: string;
  requiredEvidenceTypes: string[];
  assignedReviewerId?: string;
  status: ManualReviewStatus;
  slaDeadline: string;
  reviewerDecision?: string;
  resolvedAt?: string;
}

export interface FactVerificationSnapshotDto {
  snapshotId: string;
  verificationRunId: string;
  citizenId: string;
  factId: string;
  canonicalValue: unknown;
  canonicalSource: string;
  freshnessStatus: FactFreshnessStatus;
  policyId: string;
  policyVersion: number;
  policyConfiguration: Record<string, unknown>;
  policyChecksumSha256: string;
  checksumSha256: string;
  createdAt: string;
}

export interface FactVerificationImpactDto {
  factId: string;
  attributeKey: string;
  eligibilityReEvaluationRequired: boolean;
  recommendationRecalculationRequired: boolean;
  journeyRevalidationRequired: boolean;
  documentReverificationRequired: boolean;
  manualReviewRequired: boolean;
  noDownstreamImpact: boolean;
  impactReason: string;
  affectedSchemes: string[];
  affectedRecommendations: string[];
  affectedJourneys: string[];
  correlationId: string;
}

export interface ResolveConflictDto {
  strategy: ReconciliationStrategy;
  winningSource: string;
  winningValue?: unknown;
  overrideReason: string;
  idempotencyKey: string;
}

export interface AssignReviewDto {
  officerId: string;
  idempotencyKey: string;
}

export interface CompleteReviewDto {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  overrideValue?: unknown;
  idempotencyKey: string;
}
