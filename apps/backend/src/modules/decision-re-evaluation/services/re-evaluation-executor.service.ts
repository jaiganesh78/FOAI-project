import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  DECISION_RE_EVALUATION_REPOSITORY,
  ELIGIBILITY_RE_EVALUATION_SERVICE,
  RECOMMENDATION_RE_EVALUATION_SERVICE,
  JOURNEY_RE_EVALUATION_SERVICE,
  DECISION_DIFF_SERVICE,
  STALE_STATE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { EligibilityReEvaluationService } from './eligibility-re-evaluation.service';
import { RecommendationReEvaluationService } from './recommendation-re-evaluation.service';
import { JourneyReEvaluationService } from './journey-re-evaluation.service';
import { DecisionDiffService } from './decision-diff.service';
import { StaleStateService } from './stale-state.service';
import { ReEvaluationTarget, StepExecutionStatus, ReEvaluationStatus } from '@gpios/shared';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

@Injectable()
export class ReEvaluationExecutorService {
  private readonly logger = new Logger(ReEvaluationExecutorService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
    @Inject(ELIGIBILITY_RE_EVALUATION_SERVICE) private readonly eligibilityService: EligibilityReEvaluationService,
    @Inject(RECOMMENDATION_RE_EVALUATION_SERVICE) private readonly recommendationService: RecommendationReEvaluationService,
    @Inject(JOURNEY_RE_EVALUATION_SERVICE) private readonly journeyService: JourneyReEvaluationService,
    @Inject(DECISION_DIFF_SERVICE) private readonly diffService: DecisionDiffService,
    @Inject(STALE_STATE_SERVICE) private readonly staleStateService: StaleStateService,
  ) {}

  async executePlan(jobId: string, workerId = 'worker-1'): Promise<ReEvaluationStatus> {
    const job = await this.repo.acquireWorkerLease(jobId, workerId, 30000); // 30s lease
    if (!job) {
      this.logger.warn(`Could not acquire lease for Job '${jobId}'. Skipped or leased by another worker.`);
      return ReEvaluationStatus.RUNNING;
    }

    const steps = await this.repo.findStepsByJob(jobId);
    let stepFailures = 0;
    let stepSuccesses = 0;

    for (const step of steps) {
      const target = step.stepType as ReEvaluationTarget;

      try {
        await this.repo.updateStepStatus(step.id, { status: StepExecutionStatus.RUNNING, startedAt: new Date() });

        // Hardening Rule 6: Capture BEFORE snapshot BEFORE invoking downstream engine!
        let beforeState: Record<string, unknown> | null = null;
        if (target === ReEvaluationTarget.ELIGIBILITY) {
          beforeState = await this.eligibilityService.getLatestState(job.userId);
        } else if (target === ReEvaluationTarget.RECOMMENDATION) {
          beforeState = await this.recommendationService.getLatestState(job.userId);
        } else if (target === ReEvaluationTarget.JOURNEY) {
          beforeState = await this.journeyService.getLatestState(job.userId);
        }

        const beforeSnap = await this.repo.createStateSnapshot({
          reEvaluationId: jobId,
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          snapshotType: 'BEFORE',
          snapshotData: beforeState || {},
          dependencyVersions: { triggerVersion: job.triggerEntityVersion },
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
          policyVersions: { version: job.configurationVersion },
          checksumSha256: createHash('sha256').update(JSON.stringify(beforeState || {})).digest('hex'),
        });

        // Execute downstream engine OUTSIDE database transaction
        let afterState: Record<string, unknown>;
        if (target === ReEvaluationTarget.ELIGIBILITY) {
          const res = await this.eligibilityService.execute(job.userId);
          afterState = res as unknown as Record<string, unknown>;
        } else if (target === ReEvaluationTarget.RECOMMENDATION) {
          const res = await this.recommendationService.execute(job.userId);
          afterState = res as unknown as Record<string, unknown>;
        } else {
          const res = await this.journeyService.execute(job.userId);
          afterState = res as unknown as Record<string, unknown>;
        }

        const afterSnap = await this.repo.createStateSnapshot({
          reEvaluationId: jobId,
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          snapshotType: 'AFTER',
          snapshotData: afterState,
          dependencyVersions: { triggerVersion: job.triggerEntityVersion },
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
          policyVersions: { version: job.configurationVersion },
          checksumSha256: createHash('sha256').update(JSON.stringify(afterState)).digest('hex'),
        });

        // Compute Diff & Materiality
        const diffEval = this.diffService.computeDiff({
          reEvaluationId: jobId,
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          previousState: beforeState,
          newState: afterState,
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
        });

        await this.repo.createDiff({
          reEvaluationId: jobId,
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          changeType: diffEval.changeType,
          changedFields: diffEval.changedFields,
          previousState: beforeState || {},
          newState: afterState,
          isMaterial: diffEval.isMaterial,
          materialityReason: diffEval.materialityReason,
          materialityRuleVersion: diffEval.materialityRuleVersion,
          materialityConfigurationChecksumSha256: diffEval.materialityConfigurationChecksumSha256,
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
          checksumSha256: diffEval.checksumSha256,
        });

        // Hardening Rule 3: CAS-based StaleState clear
        await this.staleStateService.conditionalClear({
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
          reEvaluationId: jobId,
        });

        await this.repo.updateStepStatus(step.id, {
          status: StepExecutionStatus.SUCCEEDED,
          completedAt: new Date(),
          inputSnapshotId: beforeSnap.id,
          outputSnapshotId: afterSnap.id,
        });

        stepSuccesses++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Error executing step ${target} for job '${jobId}': ${errorMsg}`);

        await this.repo.updateStepStatus(step.id, {
          status: StepExecutionStatus.FAILED,
          error: errorMsg,
          completedAt: new Date(),
        });

        // Preserve stale state on failure
        await this.staleStateService.markStale({
          userId: job.userId,
          targetType: target,
          targetEntityId: job.userId,
          dependencyId: job.triggerEntityId,
          oldDependencyVersion: job.triggerEntityVersion,
          currentDependencyVersion: job.triggerEntityVersion,
          dependencyFingerprintSha256: job.dependencyFingerprintSha256,
          staleReason: `Re-evaluation step '${target}' failed: ${errorMsg}`,
          reEvaluationId: jobId,
        });

        stepFailures++;
      }
    }

    const finalStatus =
      stepFailures === 0
        ? ReEvaluationStatus.SUCCEEDED
        : stepSuccesses > 0
        ? ReEvaluationStatus.PARTIALLY_COMPLETED
        : ReEvaluationStatus.FAILED;

    // Atomic Outbox & Job Finalization
    return this.prisma.$transaction(async (tx) => {
      await tx.decisionReEvaluation.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });

      await tx.factVerificationEvent.create({
        data: {
          eventId: `evt_reeval_${jobId}`,
          eventType: finalStatus === ReEvaluationStatus.SUCCEEDED ? 'decision.reevaluation.completed' : 'decision.reevaluation_failed',
          aggregateId: jobId,
          userId: job.userId,
          correlationId: job.correlationId,
          causationId: job.causationId,
          payload: {
            reEvaluationId: jobId,
            status: finalStatus,
            stepSuccesses,
            stepFailures,
          } as Prisma.InputJsonValue,
        },
      });

      return finalStatus;
    });
  }
}
