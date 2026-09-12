import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IDecisionReEvaluationRepository } from './decision-re-evaluation.repository.interface';
import {
  DecisionReEvaluation,
  DecisionImpact,
  DecisionReEvaluationStep,
  DecisionStateSnapshot,
  DecisionDiff,
  StaleState,
  PolicyVersionActivation,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PrismaDecisionReEvaluationRepository implements IDecisionReEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findJobByIdempotencyKey(userId: string, idempotencyKey: string): Promise<DecisionReEvaluation | null> {
    return this.prisma.decisionReEvaluation.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  async findJobById(id: string): Promise<DecisionReEvaluation | null> {
    return this.prisma.decisionReEvaluation.findUnique({
      where: { id },
    });
  }

  async findJobsByUserId(userId: string): Promise<DecisionReEvaluation[]> {
    return this.prisma.decisionReEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(data: {
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
  }): Promise<DecisionReEvaluation> {
    return this.prisma.decisionReEvaluation.create({
      data: {
        userId: data.userId,
        triggerType: data.triggerType,
        triggerEntityId: data.triggerEntityId,
        triggerEntityVersion: data.triggerEntityVersion,
        sourceEventId: data.sourceEventId,
        priority: data.priority || 100,
        rootEventId: data.rootEventId,
        correlationId: data.correlationId,
        causationId: data.causationId,
        propagationDepth: data.propagationDepth || 1,
        idempotencyKey: data.idempotencyKey,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        configurationVersion: data.configurationVersion || 1,
        configurationChecksumSha256: data.configurationChecksumSha256,
        status: 'PENDING',
      },
    });
  }

  async acquireWorkerLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<DecisionReEvaluation | null> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseDurationMs);

    const job = await this.prisma.decisionReEvaluation.findUnique({ where: { id: jobId } });
    if (!job) return null;

    if (job.status !== 'PENDING' && job.status !== 'RUNNING' && job.status !== 'RETRYABLE_FAILURE') {
      return null;
    }

    if (job.status === 'RUNNING' && job.leaseExpiresAt && job.leaseExpiresAt > now && job.leaseOwner !== workerId) {
      return null; // Active lease held by another worker
    }

    return this.prisma.decisionReEvaluation.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        leaseOwner: workerId,
        leaseExpiresAt: expiresAt,
        startedAt: job.startedAt || now,
        version: job.version + 1,
      },
    });
  }

  async renewWorkerLease(jobId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + leaseDurationMs);

    const updated = await this.prisma.decisionReEvaluation.updateMany({
      where: {
        id: jobId,
        leaseOwner: workerId,
        status: 'RUNNING',
      },
      data: {
        leaseExpiresAt: expiresAt,
      },
    });

    return updated.count > 0;
  }

  async updateJobStatus(
    jobId: string,
    data: {
      status: string;
      failureReason?: string;
      expectedVersion?: number;
      completedAt?: Date;
    },
  ): Promise<DecisionReEvaluation> {
    const existing = await this.prisma.decisionReEvaluation.findUnique({ where: { id: jobId } });
    if (!existing) throw new ConflictException(`Re-evaluation Job '${jobId}' not found.`);

    if (data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
      throw new ConflictException(
        `Optimistic concurrency conflict on Job '${jobId}'. Expected version ${data.expectedVersion}, but current is ${existing.version}.`,
      );
    }

    return this.prisma.decisionReEvaluation.update({
      where: { id: jobId },
      data: {
        status: data.status,
        failureReason: data.failureReason !== undefined ? data.failureReason : existing.failureReason,
        completedAt: data.completedAt || (['SUCCEEDED', 'PARTIALLY_COMPLETED', 'FAILED', 'SUPERSEDED'].includes(data.status) ? new Date() : undefined),
        leaseOwner: null,
        leaseExpiresAt: null,
        version: existing.version + 1,
      },
    });
  }

  async createImpact(data: {
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
  }): Promise<DecisionImpact> {
    return this.prisma.decisionImpact.create({
      data: {
        reEvaluationId: data.reEvaluationId,
        userId: data.userId,
        targetType: data.targetType,
        targetEntityId: data.targetEntityId,
        impactType: data.impactType,
        severity: data.severity || 'MEDIUM',
        sourceFactId: data.sourceFactId,
        sourceFactVersion: data.sourceFactVersion,
        sourceEventId: data.sourceEventId,
        oldDependencyVersion: data.oldDependencyVersion,
        newDependencyVersion: data.newDependencyVersion,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        reason: data.reason,
        requiresReEvaluation: data.requiresReEvaluation !== undefined ? data.requiresReEvaluation : true,
      },
    });
  }

  async findImpactBySourceEvent(sourceEventId: string, targetType: string, targetEntityId: string): Promise<DecisionImpact | null> {
    return this.prisma.decisionImpact.findUnique({
      where: {
        sourceEventId_targetType_targetEntityId: {
          sourceEventId,
          targetType,
          targetEntityId,
        },
      },
    });
  }

  async findImpactsByJob(reEvaluationId: string): Promise<DecisionImpact[]> {
    return this.prisma.decisionImpact.findMany({
      where: { reEvaluationId },
    });
  }

  async createStep(data: {
    reEvaluationId: string;
    stepType: string;
    executionOrder: number;
    status?: string;
    dependencyFingerprintSha256: string;
  }): Promise<DecisionReEvaluationStep> {
    return this.prisma.decisionReEvaluationStep.create({
      data: {
        reEvaluationId: data.reEvaluationId,
        stepType: data.stepType,
        executionOrder: data.executionOrder,
        status: data.status || 'PENDING',
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
      },
    });
  }

  async updateStepStatus(
    stepId: string,
    data: {
      status: string;
      startedAt?: Date;
      completedAt?: Date;
      inputSnapshotId?: string;
      outputSnapshotId?: string;
      error?: string;
    },
  ): Promise<DecisionReEvaluationStep> {
    return this.prisma.decisionReEvaluationStep.update({
      where: { id: stepId },
      data: {
        status: data.status,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        inputSnapshotId: data.inputSnapshotId,
        outputSnapshotId: data.outputSnapshotId,
        error: data.error,
      },
    });
  }

  async findStepsByJob(reEvaluationId: string): Promise<DecisionReEvaluationStep[]> {
    return this.prisma.decisionReEvaluationStep.findMany({
      where: { reEvaluationId },
      orderBy: { executionOrder: 'asc' },
    });
  }

  async createStateSnapshot(data: {
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
  }): Promise<DecisionStateSnapshot> {
    return this.prisma.decisionStateSnapshot.create({
      data: {
        reEvaluationId: data.reEvaluationId,
        userId: data.userId,
        targetType: data.targetType,
        targetEntityId: data.targetEntityId,
        snapshotType: data.snapshotType,
        snapshotData: data.snapshotData as Prisma.InputJsonValue,
        dependencyVersions: data.dependencyVersions as Prisma.InputJsonValue,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        policyVersions: data.policyVersions as Prisma.InputJsonValue,
        checksumSha256: data.checksumSha256,
      },
    });
  }

  async findSnapshotsByJob(reEvaluationId: string): Promise<DecisionStateSnapshot[]> {
    return this.prisma.decisionStateSnapshot.findMany({
      where: { reEvaluationId },
    });
  }

  async getSnapshotById(snapshotId: string): Promise<DecisionStateSnapshot | null> {
    return this.prisma.decisionStateSnapshot.findUnique({
      where: { id: snapshotId },
    });
  }

  async createDiff(data: {
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
  }): Promise<DecisionDiff> {
    return this.prisma.decisionDiff.create({
      data: {
        reEvaluationId: data.reEvaluationId,
        userId: data.userId,
        targetType: data.targetType,
        targetEntityId: data.targetEntityId,
        changeType: data.changeType,
        changedFields: data.changedFields as Prisma.InputJsonValue,
        previousState: data.previousState as Prisma.InputJsonValue,
        newState: data.newState as Prisma.InputJsonValue,
        isMaterial: data.isMaterial,
        materialityReason: data.materialityReason,
        materialityRuleVersion: data.materialityRuleVersion || 1,
        materialityConfigurationChecksumSha256: data.materialityConfigurationChecksumSha256,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        checksumSha256: data.checksumSha256,
      },
    });
  }

  async findDiffsByJob(reEvaluationId: string): Promise<DecisionDiff[]> {
    return this.prisma.decisionDiff.findMany({
      where: { reEvaluationId },
    });
  }

  async upsertStaleState(data: {
    userId: string;
    targetType: string;
    targetEntityId: string;
    dependencyId: string;
    oldDependencyVersion: number;
    currentDependencyVersion: number;
    dependencyFingerprintSha256: string;
    staleReason: string;
    reEvaluationId?: string;
  }): Promise<StaleState> {
    return this.prisma.staleState.upsert({
      where: {
        userId_targetType_targetEntityId: {
          userId: data.userId,
          targetType: data.targetType,
          targetEntityId: data.targetEntityId,
        },
      },
      update: {
        oldDependencyVersion: data.oldDependencyVersion,
        currentDependencyVersion: data.currentDependencyVersion,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        staleReason: data.staleReason,
        status: 'STALE',
        reEvaluationId: data.reEvaluationId,
        staleAt: new Date(),
        clearedAt: null,
      },
      create: {
        userId: data.userId,
        targetType: data.targetType,
        targetEntityId: data.targetEntityId,
        dependencyId: data.dependencyId,
        oldDependencyVersion: data.oldDependencyVersion,
        currentDependencyVersion: data.currentDependencyVersion,
        dependencyFingerprintSha256: data.dependencyFingerprintSha256,
        staleReason: data.staleReason,
        status: 'STALE',
        reEvaluationId: data.reEvaluationId,
      },
    });
  }

  async conditionalClearStaleState(
    userId: string,
    targetType: string,
    targetEntityId: string,
    expectedDependencyFingerprintSha256: string,
    reEvaluationId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.staleState.findUnique({
      where: {
        userId_targetType_targetEntityId: {
          userId,
          targetType,
          targetEntityId,
        },
      },
    });

    if (!existing) return true; // Already clear

    // CAS Hardening Rule 3: Old job evaluation CANNOT clear stale marker created by newer dependency fingerprint!
    if (existing.dependencyFingerprintSha256 !== expectedDependencyFingerprintSha256) {
      return false; // Dependency fingerprint changed after evaluation started! Refuse clear.
    }

    const updated = await this.prisma.staleState.updateMany({
      where: {
        id: existing.id,
        dependencyFingerprintSha256: expectedDependencyFingerprintSha256,
        status: 'STALE',
      },
      data: {
        status: 'CLEARED',
        clearedAt: new Date(),
        reEvaluationId,
        version: existing.version + 1,
      },
    });

    return updated.count > 0;
  }

  async findActiveStaleStates(userId: string): Promise<StaleState[]> {
    return this.prisma.staleState.findMany({
      where: { userId, status: 'STALE' },
    });
  }

  async createPolicyActivation(data: {
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
  }): Promise<PolicyVersionActivation> {
    return this.prisma.policyVersionActivation.create({
      data: {
        policyId: data.policyId,
        policyTitle: data.policyTitle,
        version: data.version,
        activationReason: data.activationReason,
        checksumSha256: data.checksumSha256,
        affectedFacts: data.affectedFacts as Prisma.InputJsonValue,
        affectedRules: data.affectedRules as Prisma.InputJsonValue,
        affectedAttributeKeys: data.affectedAttributeKeys as Prisma.InputJsonValue,
        discoveredPopulationCount: data.discoveredPopulationCount,
        populationSelectionChecksum: data.populationSelectionChecksum,
        activatedBy: data.activatedBy,
      },
    });
  }

  async findPolicyActivation(policyId: string, version: number): Promise<PolicyVersionActivation | null> {
    return this.prisma.policyVersionActivation.findUnique({
      where: { policyId_version: { policyId, version } },
    });
  }
}
