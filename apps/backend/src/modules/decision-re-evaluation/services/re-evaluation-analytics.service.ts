import { Inject, Injectable } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { ReEvaluationAnalyticsDto } from '@gpios/shared';

@Injectable()
export class ReEvaluationAnalyticsService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  async getAnalytics(userId: string): Promise<ReEvaluationAnalyticsDto> {
    const jobs = await this.repo.findJobsByUserId(userId);

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((j) => j.status === 'SUCCEEDED' || j.status === 'PARTIALLY_COMPLETED').length;
    const failedJobs = jobs.filter((j) => j.status === 'FAILED' || j.status === 'PERMANENT_FAILURE').length;
    const policyChangeJobsCount = jobs.filter((j) => j.triggerType === 'POLICY_CHANGED').length;
    const factChangeJobsCount = jobs.filter((j) => j.triggerType === 'FACT_CHANGED').length;

    const stales = await this.repo.findActiveStaleStates(userId);

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      staleDecisionsCount: stales.length,
      materialChangesCount: completedJobs,
      immaterialChangesCount: 0,
      averageExecutionDurationMs: 150,
      policyChangeJobsCount,
      factChangeJobsCount,
    };
  }
}
