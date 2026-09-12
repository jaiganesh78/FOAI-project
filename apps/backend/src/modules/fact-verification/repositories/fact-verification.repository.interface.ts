import {
  FactVerificationPolicy,
  FactVerificationRun,
  FactVerificationResolution,
  FactVerificationReview,
  FactVerificationSnapshot,
  FactVerificationEvent,
} from '@prisma/client';

export interface IFactVerificationRepository {
  findActivePolicy(attributeKey: string): Promise<FactVerificationPolicy | null>;
  findPolicyByVersion(attributeKey: string, version: number): Promise<FactVerificationPolicy | null>;
  findVerificationRunByIdempotencyKey(userId: string, idempotencyKey: string): Promise<FactVerificationRun | null>;
  createVerificationRun(data: {
    userId: string;
    factId: string;
    attributeKey: string;
    policyId: string;
    policyVersion: number;
    policyConfiguration: unknown;
    policyChecksumSha256: string;
    idempotencyKey: string;
    status: string;
  }): Promise<FactVerificationRun>;

  createResolution(data: {
    verificationRunId: string;
    factId: string;
    attributeKey: string;
    winningValue: unknown;
    winningSource: string;
    winningSourcePrecedence: number;
    losingValues: unknown;
    strategy: string;
    resolutionReason: string;
    policyId: string;
    policyVersion: number;
    policyChecksumSha256: string;
    resolvedBy: string;
  }): Promise<FactVerificationResolution>;

  createReview(data: {
    conflictId: string;
    citizenId: string;
    attributeKey: string;
    priority: number;
    reason: string;
    requiredEvidenceTypes: unknown;
    slaDeadline: Date;
  }): Promise<FactVerificationReview>;

  findReviewById(reviewId: string): Promise<FactVerificationReview | null>;
  findReviewsByCitizenId(citizenId: string): Promise<FactVerificationReview[]>;
  updateReview(reviewId: string, data: {
    assignedReviewerId?: string;
    status?: string;
    reviewerDecision?: string;
    expectedVersion?: number;
  }): Promise<FactVerificationReview>;

  createSnapshot(data: {
    verificationRunId: string;
    citizenId: string;
    factId: string;
    canonicalValue: unknown;
    canonicalSource: string;
    freshnessStatus: string;
    policyId: string;
    policyVersion: number;
    policyConfiguration: unknown;
    policyChecksumSha256: string;
    checksumSha256: string;
  }): Promise<FactVerificationSnapshot>;

  getSnapshotByRun(verificationRunId: string): Promise<FactVerificationSnapshot | null>;
  getRunById(runId: string): Promise<FactVerificationRun | null>;
  createOutboxEvent(data: {
    eventId: string;
    eventType: string;
    eventVersion?: string;
    aggregateId: string;
    userId: string;
    correlationId?: string;
    causationId?: string;
    payload: unknown;
  }): Promise<FactVerificationEvent>;
}
