import { StandardDomainEventEnvelope } from './domain-event.registry';

export interface EligibilityStartedPayload {
  userId: string;
  citizenSnapshotId: string;
  correlationId: string;
}

export interface EligibilityCompletedPayload {
  userId: string;
  snapshotId: string;
  traceId: string;
  eligiblePoliciesCount: number;
  ineligiblePoliciesCount: number;
  executionDurationMs: number;
}

export interface DecisionTraceCreatedPayload {
  traceId: string;
  userId: string;
  policyVersionId: string;
  policyRuleVersionId: string;
  status: string;
  evaluatedRulesCount: number;
}

export type EligibilityStartedEvent = StandardDomainEventEnvelope<EligibilityStartedPayload>;
export type EligibilityCompletedEvent = StandardDomainEventEnvelope<EligibilityCompletedPayload>;
export type DecisionTraceCreatedEvent = StandardDomainEventEnvelope<DecisionTraceCreatedPayload>;
