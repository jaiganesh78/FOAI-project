import { Inject, Injectable } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { ReEvaluationTarget, ReEvaluationStepDto, StepExecutionStatus } from '@gpios/shared';

@Injectable()
export class ReEvaluationPlannerService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  async createPlan(params: {
    reEvaluationId: string;
    targetTypes: ReEvaluationTarget[];
    fingerprintSha256: string;
  }): Promise<{ steps: ReEvaluationStepDto[]; isNoOp: boolean }> {
    if (params.targetTypes.length === 0) {
      return { steps: [], isNoOp: true };
    }

    // Topological Order: ELIGIBILITY (order 1) -> RECOMMENDATION (order 2) -> JOURNEY (order 3)
    const sortedTargets = [...params.targetTypes].sort((a, b) => {
      const orderMap: Record<ReEvaluationTarget, number> = {
        [ReEvaluationTarget.ELIGIBILITY]: 1,
        [ReEvaluationTarget.RECOMMENDATION]: 2,
        [ReEvaluationTarget.JOURNEY]: 3,
      };
      return orderMap[a] - orderMap[b];
    });

    const steps: ReEvaluationStepDto[] = [];
    for (let i = 0; i < sortedTargets.length; i++) {
      const target = sortedTargets[i];
      const step = await this.repo.createStep({
        reEvaluationId: params.reEvaluationId,
        stepType: target,
        executionOrder: i + 1,
        dependencyFingerprintSha256: params.fingerprintSha256,
      });

      steps.push({
        stepId: step.id,
        reEvaluationId: step.reEvaluationId,
        stepType: step.stepType as ReEvaluationTarget,
        executionOrder: step.executionOrder,
        status: step.status as StepExecutionStatus,
        dependencyFingerprintSha256: step.dependencyFingerprintSha256,
        retryCount: step.retryCount,
      });
    }

    return { steps, isNoOp: false };
  }
}
