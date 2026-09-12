import {
  ReEvaluationStatus,
  StepExecutionStatus,
  ImpactType,
  DecisionChangeType,
  ReEvaluationPriority,
  ReEvaluationTarget,
} from '../enums';

export interface DependencyFingerprintDto {
  factVersions: Record<string, number>;
  policyVersions: Record<string, number>;
  eligibilitySnapshotVersion?: number;
  recommendationSnapshotVersion?: number;
  journeyVersion?: number;
  configurationVersion: number;
  fingerprintSha256: string;
}

export interface TriggerReEvaluationDto {
  triggerType: string;
  triggerEntityId: string;
  triggerEntityVersion: number;
  sourceEventId: string;
  idempotencyKey: string;
  priority?: ReEvaluationPriority;
}

export interface DecisionImpactDto {
  impactId: string;
  reEvaluationId: string;
  userId: string;
  targetType: ReEvaluationTarget;
  targetEntityId: string;
  impactType: ImpactType;
  severity: string;
  sourceFactId?: string;
  sourceFactVersion?: number;
  sourceEventId: string;
  oldDependencyVersion?: number;
  newDependencyVersion?: number;
  dependencyFingerprintSha256: string;
  reason: string;
  requiresReEvaluation: boolean;
  isEvaluated: boolean;
  createdAt: string;
}

export interface ReEvaluationStepDto {
  stepId: string;
  reEvaluationId: string;
  stepType: ReEvaluationTarget;
  executionOrder: number;
  status: StepExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  inputSnapshotId?: string;
  outputSnapshotId?: string;
  dependencyFingerprintSha256: string;
  error?: string;
  retryCount: number;
}

export interface DecisionDiffDto {
  diffId: string;
  reEvaluationId: string;
  userId: string;
  targetType: ReEvaluationTarget;
  targetEntityId: string;
  changeType: DecisionChangeType;
  changedFields: Record<string, unknown>;
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  isMaterial: boolean;
  materialityReason: string;
  materialityRuleVersion: number;
  materialityConfigurationChecksumSha256: string;
  dependencyFingerprintSha256: string;
  checksumSha256: string;
  createdAt: string;
}

export interface StaleStateDto {
  staleId: string;
  userId: string;
  targetType: ReEvaluationTarget;
  targetEntityId: string;
  dependencyId: string;
  oldDependencyVersion: number;
  currentDependencyVersion: number;
  dependencyFingerprintSha256: string;
  staleReason: string;
  status: 'STALE' | 'CLEARED';
  reEvaluationId?: string;
  staleAt: string;
  clearedAt?: string;
}

export interface PolicyChangeAnalysisDto {
  activationId: string;
  policyId: string;
  policyTitle: string;
  version: number;
  activationReason: string;
  checksumSha256: string;
  affectedAttributeKeys: string[];
  discoveredPopulationCount: number;
  populationSelectionChecksum: string;
  activatedBy: string;
  activatedAt: string;
}

export interface ReEvaluationReplayDto {
  isVerified: boolean;
  originalChecksum: string;
  replayChecksum: string;
  isMatch: boolean;
  mismatchReason?: string;
  snapshot: Record<string, unknown>;
}

export interface ReEvaluationAnalyticsDto {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  staleDecisionsCount: number;
  materialChangesCount: number;
  immaterialChangesCount: number;
  averageExecutionDurationMs: number;
  policyChangeJobsCount: number;
  factChangeJobsCount: number;
}

export interface TriggerPolicyChangeDto {
  policyId: string;
  version: number;
  activationReason: string;
  idempotencyKey: string;
}

export interface DecisionReEvaluationDto {
  reEvaluationId: string;
  userId: string;
  triggerType: string;
  triggerEntityId: string;
  triggerEntityVersion: number;
  sourceEventId: string;
  status: ReEvaluationStatus;
  priority: ReEvaluationPriority;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  retryCount: number;
  maxRetries: number;
  rootEventId: string;
  correlationId: string;
  causationId: string;
  propagationDepth: number;
  idempotencyKey: string;
  dependencyFingerprintSha256: string;
  configurationVersion: number;
  configurationChecksumSha256: string;
  failureReason?: string;
  startedAt?: string;
  completedAt?: string;
  impacts?: DecisionImpactDto[];
  steps?: ReEvaluationStepDto[];
  diffs?: DecisionDiffDto[];
  createdAt: string;
}
