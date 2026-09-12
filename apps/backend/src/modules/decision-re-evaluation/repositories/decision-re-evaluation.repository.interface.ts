import {
  DecisionReEvaluation,
  DecisionImpact,
  DecisionReEvaluationStep,
  DecisionStateSnapshot,
  DecisionDiff,
  StaleState,
  PolicyVersionActivation,
} from '@prisma/client';

export interface IDecisionReEvaluationRepository {
  findJobByIdempotencyKey(userId: string, idempotencyKey: string): Promise<DecisionReEvaluation | null>;
  findJobById(id: string): Promise<DecisionReEvaluation | null>;
  findJobsByUserId(userId: string): Promise<DecisionReEvaluation[]>;

  createJob(data: {
    userId: string;
    triggerType: string;
    triggerEntityId: string;
    triggerEntityVersion: number;
    sourceEventId: string;
    priority?: number;
    rootEventId: string;
    correlationId: string;
    causationId?: string;
    propagationDepth?: number;
    idempotencyKey: string;
    dependencyFingerprintSha256: string;
    configurationVersion?: number;
    configurationChecksumSha256: string;
  }): Promise<DecisionReEvaluation>;

  acquireWorkerLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<DecisionReEvaluation | null>;
  renewWorkerLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<boolean>;

  updateJobStatus(
    jobId: string,
    data: {
      status: string;
      failureReason?: string;
      expectedVersion?: number;
      completedAt?: Date;
    },
  ): Promise<DecisionReEvaluation>;

  createImpact(data: {
    reEvaluationId: string;
    userId: string;
    targetType: string;
    targetEntityId: string;
    impactType: string;
    severity?: string;
    sourceFactId?: string;
    sourceFactVersion?: number;
    sourceEventId: string;
    oldDependencyVersion?: number;
    newDependencyVersion?: number;
    dependencyFingerprintSha256: string;
    reason: string;
    requiresReEvaluation?: boolean;
  }): Promise<DecisionImpact>;

  findImpactBySourceEvent(sourceEventId: string, targetType: string, targetEntityId: string): Promise<DecisionImpact | null>;
  findImpactsByJob(reEvaluationId: string): Promise<DecisionImpact[]>;

  createStep(data: {
    reEvaluationId: string;
    stepType: string;
    executionOrder: number;
    status?: string;
    dependencyFingerprintSha256: string;
  }): Promise<DecisionReEvaluationStep>;

  updateStepStatus(
    stepId: string,
    data: {
      status: string;
      startedAt?: Date;
      completedAt?: Date;
      inputSnapshotId?: string;
      outputSnapshotId?: string;
      error?: string;
    },
  ): Promise<DecisionReEvaluationStep>;

  findStepsByJob(reEvaluationId: string): Promise<DecisionReEvaluationStep[]>;

  createStateSnapshot(data: {
    reEvaluationId: string;
    userId: string;
    targetType: string;
    targetEntityId: string;
    snapshotType: 'BEFORE' | 'AFTER';
    snapshotData: unknown;
    dependencyVersions: unknown;
    dependencyFingerprintSha256: string;
    policyVersions: unknown;
    checksumSha256: string;
  }): Promise<DecisionStateSnapshot>;

  findSnapshotsByJob(reEvaluationId: string): Promise<DecisionStateSnapshot[]>;
  getSnapshotById(snapshotId: string): Promise<DecisionStateSnapshot | null>;

  createDiff(data: {
    reEvaluationId: string;
    userId: string;
    targetType: string;
    targetEntityId: string;
    changeType: string;
    changedFields: unknown;
    previousState: unknown;
    newState: unknown;
    isMaterial: boolean;
    materialityReason: string;
    materialityRuleVersion?: number;
    materialityConfigurationChecksumSha256: string;
    dependencyFingerprintSha256: string;
    checksumSha256: string;
  }): Promise<DecisionDiff>;

  findDiffsByJob(reEvaluationId: string): Promise<DecisionDiff[]>;

  upsertStaleState(data: {
    userId: string;
    targetType: string;
    targetEntityId: string;
    dependencyId: string;
    oldDependencyVersion: number;
    currentDependencyVersion: number;
    dependencyFingerprintSha256: string;
    staleReason: string;
    reEvaluationId?: string;
  }): Promise<StaleState>;

  conditionalClearStaleState(
    userId: string,
    targetType: string,
    targetEntityId: string,
    expectedDependencyFingerprintSha256: string,
    reEvaluationId: string,
  ): Promise<boolean>;

  findActiveStaleStates(userId: string): Promise<StaleState[]>;

  createPolicyActivation(data: {
    policyId: string;
    policyTitle: string;
    version: number;
    activationReason: string;
    checksumSha256: string;
    affectedFacts: unknown;
    affectedRules: unknown;
    affectedAttributeKeys: unknown;
    discoveredPopulationCount: number;
    populationSelectionChecksum: string;
    activatedBy: string;
  }): Promise<PolicyVersionActivation>;

  findPolicyActivation(policyId: string, version: number): Promise<PolicyVersionActivation | null>;
}
