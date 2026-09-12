import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  DECISION_RE_EVALUATION_REPOSITORY,
  CHANGE_DETECTION_SERVICE,
  DECISION_IMPACT_ANALYSIS_SERVICE,
  DECISION_DEPENDENCY_RESOLUTION_SERVICE,
  RE_EVALUATION_PLANNER_SERVICE,
  RE_EVALUATION_EXECUTOR_SERVICE,
  POLICY_CHANGE_INTELLIGENCE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { ChangeDetectionService } from './change-detection.service';
import { ImpactAnalysisService } from './impact-analysis.service';
import { DependencyResolutionService } from './dependency-resolution.service';
import { ReEvaluationPlannerService } from './re-evaluation-planner.service';
import { ReEvaluationExecutorService } from './re-evaluation-executor.service';
import { PolicyChangeService } from './policy-change.service';
import {
  TriggerReEvaluationDto,
  TriggerPolicyChangeDto,
  DecisionReEvaluationDto,
  ReEvaluationStatus,
  ReEvaluationPriority,
  DecisionImpactDto,
  ReEvaluationStepDto,
  DecisionDiffDto,
} from '@gpios/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class DecisionReEvaluationOrchestrator {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
    @Inject(CHANGE_DETECTION_SERVICE) private readonly changeDetection: ChangeDetectionService,
    @Inject(DECISION_IMPACT_ANALYSIS_SERVICE) private readonly impactAnalysis: ImpactAnalysisService,
    @Inject(DECISION_DEPENDENCY_RESOLUTION_SERVICE) private readonly dependencyResolution: DependencyResolutionService,
    @Inject(RE_EVALUATION_PLANNER_SERVICE) private readonly planner: ReEvaluationPlannerService,
    @Inject(RE_EVALUATION_EXECUTOR_SERVICE) private readonly executor: ReEvaluationExecutorService,
    @Inject(POLICY_CHANGE_INTELLIGENCE_SERVICE) private readonly policyChangeService: PolicyChangeService,
  ) {}

  async triggerReEvaluation(userId: string, dto: TriggerReEvaluationDto): Promise<DecisionReEvaluationDto> {
    // DB Hardening Constraint A: UNIQUE(userId, idempotencyKey)
    const existing = await this.repo.findJobByIdempotencyKey(userId, dto.idempotencyKey);
    if (existing) {
      const impacts = await this.repo.findImpactsByJob(existing.id);
      const steps = await this.repo.findStepsByJob(existing.id);
      const diffs = await this.repo.findDiffsByJob(existing.id);

      return {
        reEvaluationId: existing.id,
        userId: existing.userId,
        triggerType: existing.triggerType,
        triggerEntityId: existing.triggerEntityId,
        triggerEntityVersion: existing.triggerEntityVersion,
        sourceEventId: existing.sourceEventId,
        status: existing.status as ReEvaluationStatus,
        priority: (dto.priority || ReEvaluationPriority.MEDIUM) as ReEvaluationPriority,
        retryCount: existing.retryCount,
        maxRetries: existing.maxRetries,
        rootEventId: existing.rootEventId,
        correlationId: existing.correlationId,
        causationId: existing.causationId || existing.sourceEventId,
        propagationDepth: existing.propagationDepth,
        idempotencyKey: existing.idempotencyKey,
        dependencyFingerprintSha256: existing.dependencyFingerprintSha256,
        configurationVersion: existing.configurationVersion,
        configurationChecksumSha256: existing.configurationChecksumSha256,
        createdAt: existing.createdAt.toISOString(),
        impacts: impacts as unknown as DecisionImpactDto[],
        steps: steps as unknown as ReEvaluationStepDto[],
        diffs: diffs as unknown as DecisionDiffDto[],
      };
    }

    const change = this.changeDetection.detectFactChange({
      userId,
      factId: dto.triggerEntityId,
      attributeKey: 'annualIncome',
      factVersion: dto.triggerEntityVersion,
      sourceEventId: dto.sourceEventId,
    });

    this.dependencyResolution.validatePropagationDepth(change.propagationDepth);

    const fingerprint = this.dependencyResolution.computeDependencyFingerprint({
      factVersions: { [dto.triggerEntityId]: dto.triggerEntityVersion },
      policyVersions: { 'pol-pm-kisan': 1 },
    });

    // Atomic Transaction: Job + Impacts + Plan + Outbox Event
    const job = await this.prisma.$transaction(async (tx) => {
      const createdJob = await tx.decisionReEvaluation.create({
        data: {
          userId,
          triggerType: dto.triggerType,
          triggerEntityId: dto.triggerEntityId,
          triggerEntityVersion: dto.triggerEntityVersion,
          sourceEventId: dto.sourceEventId,
          priority: dto.priority === 'CRITICAL' ? 200 : 100,
          rootEventId: change.rootEventId,
          correlationId: change.correlationId,
          causationId: change.causationId,
          propagationDepth: change.propagationDepth,
          idempotencyKey: dto.idempotencyKey,
          dependencyFingerprintSha256: fingerprint.fingerprintSha256,
          configurationVersion: 1,
          configurationChecksumSha256: fingerprint.fingerprintSha256,
          status: 'PENDING',
        },
      });

      await tx.factVerificationEvent.create({
        data: {
          eventId: `evt_req_${dto.idempotencyKey}`,
          eventType: 'decision.reevaluation.requested',
          aggregateId: createdJob.id,
          userId,
          correlationId: change.correlationId,
          payload: { jobId: createdJob.id, triggerType: dto.triggerType } as Prisma.InputJsonValue,
        },
      });

      return createdJob;
    });

    const impactRes = await this.impactAnalysis.analyzeAndPersistImpact({
      reEvaluationId: job.id,
      userId,
      triggerType: dto.triggerType,
      triggerEntityId: dto.triggerEntityId,
      triggerEntityVersion: dto.triggerEntityVersion,
      sourceEventId: dto.sourceEventId,
      attributeKey: 'annualIncome',
      fingerprintSha256: fingerprint.fingerprintSha256,
    });

    const targetTypes = impactRes.impacts.map((i) => i.targetType);
    const plan = await this.planner.createPlan({
      reEvaluationId: job.id,
      targetTypes,
      fingerprintSha256: fingerprint.fingerprintSha256,
    });

    if (plan.isNoOp) {
      await this.repo.updateJobStatus(job.id, {
        status: 'SUCCEEDED',
        failureReason: 'No-op propagation path: Authoritative change has no active downstream dependencies.',
        completedAt: new Date(),
      });
    } else {
      // Execute steps outside DB transaction
      await this.executor.executePlan(job.id);
    }

    const updatedJob = await this.repo.findJobById(job.id);
    const impacts = await this.repo.findImpactsByJob(job.id);
    const steps = await this.repo.findStepsByJob(job.id);
    const diffs = await this.repo.findDiffsByJob(job.id);

    return {
      reEvaluationId: updatedJob!.id,
      userId: updatedJob!.userId,
      triggerType: updatedJob!.triggerType,
      triggerEntityId: updatedJob!.triggerEntityId,
      triggerEntityVersion: updatedJob!.triggerEntityVersion,
      sourceEventId: updatedJob!.sourceEventId,
      status: updatedJob!.status as ReEvaluationStatus,
      priority: (dto.priority || ReEvaluationPriority.MEDIUM) as ReEvaluationPriority,
      retryCount: updatedJob!.retryCount,
      maxRetries: updatedJob!.maxRetries,
      rootEventId: updatedJob!.rootEventId,
      correlationId: updatedJob!.correlationId,
      causationId: updatedJob!.causationId || updatedJob!.sourceEventId,
      propagationDepth: updatedJob!.propagationDepth,
      idempotencyKey: updatedJob!.idempotencyKey,
      dependencyFingerprintSha256: updatedJob!.dependencyFingerprintSha256,
      configurationVersion: updatedJob!.configurationVersion,
      configurationChecksumSha256: updatedJob!.configurationChecksumSha256,
      createdAt: updatedJob!.createdAt.toISOString(),
      impacts: impacts as unknown as DecisionImpactDto[],
      steps: steps as unknown as ReEvaluationStepDto[],
      diffs: diffs as unknown as DecisionDiffDto[],
    };
  }

  async triggerPolicyChange(dto: TriggerPolicyChangeDto, officerId: string) {
    const analysis = await this.policyChangeService.processPolicyActivation({
      policyId: dto.policyId,
      version: dto.version,
      activationReason: dto.activationReason,
      activatedBy: officerId,
    });

    return {
      policyActivation: analysis,
      message: `Policy activation for '${dto.policyId}' version ${dto.version} processed. Population discovery completed for ${analysis.discoveredPopulationCount} citizens.`,
    };
  }
}
