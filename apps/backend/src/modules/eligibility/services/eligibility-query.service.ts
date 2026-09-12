import { Inject, Injectable } from '@nestjs/common';
import {
  ELIGIBILITY_SNAPSHOT_REPOSITORY,
  DECISION_TRACE_REPOSITORY,
  EVALUATION_METRICS_SERVICE,
  DECISION_REPLAY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { IEligibilitySnapshotRepository, EligibilitySnapshotWithDetails } from '../repositories/eligibility-snapshot.repository.interface';
import { IDecisionTraceRepository } from '../repositories/decision-trace.repository.interface';
import { EvaluationMetricsService } from './evaluation-metrics.service';
import { DecisionReplayService, DecisionReplayResult } from './decision-replay.service';
import { EligibilitySnapshotDto, DecisionTraceDto, EvaluationMetricsDto, EligibilityStatus, OpportunityGapType } from '@gpios/shared';

@Injectable()
export class EligibilityQueryService {
  constructor(
    @Inject(ELIGIBILITY_SNAPSHOT_REPOSITORY) private readonly snapshotRepository: IEligibilitySnapshotRepository,
    @Inject(DECISION_TRACE_REPOSITORY) private readonly traceRepository: IDecisionTraceRepository,
    @Inject(EVALUATION_METRICS_SERVICE) private readonly metricsService: EvaluationMetricsService,
    @Inject(DECISION_REPLAY_SERVICE) private readonly replayService: DecisionReplayService,
  ) {}

  async getLatestSnapshot(userId: string): Promise<EligibilitySnapshotDto | null> {
    const s = await this.snapshotRepository.findLatestByUserId(userId);
    if (!s) return null;
    return this.mapToSnapshotDto(s);
  }

  async getSnapshotById(id: string): Promise<EligibilitySnapshotDto | null> {
    const s = await this.snapshotRepository.findById(id);
    if (!s) return null;
    return this.mapToSnapshotDto(s);
  }

  async getTraceById(id: string): Promise<DecisionTraceDto | null> {
    const t = await this.traceRepository.findById(id);
    if (!t) return null;
    return {
      id: t.id,
      userId: t.userId,
      citizenSnapshotId: t.citizenSnapshotId,
      policyVersionId: t.policyVersionId,
      policyRuleVersionId: t.policyRuleVersionId,
      status: t.status as unknown as EligibilityStatus,
      executionDurationMs: t.executionDurationMs,
      traceVersion: t.traceVersion,
      engineVersion: t.engineVersion,
      correlationId: t.correlationId,
      evaluatedRulesCount: t.evaluatedRulesCount,
      passedRulesCount: t.passedRulesCount,
      failedRulesCount: t.failedRulesCount,
      skippedRulesCount: t.skippedRulesCount,
      createdAt: t.createdAt.toISOString(),
      nodes: t.nodes,
      edges: t.edges,
    };
  }

  async replayDecision(snapshotId: string): Promise<DecisionReplayResult> {
    return this.replayService.replayDecision(snapshotId);
  }

  async getMetrics(userId: string): Promise<EvaluationMetricsDto> {
    return this.metricsService.getLatestMetrics(userId);
  }

  private mapToSnapshotDto(s: EligibilitySnapshotWithDetails): EligibilitySnapshotDto {
    return {
      id: s.id,
      userId: s.userId,
      citizenSnapshotId: s.citizenSnapshotId,
      policyVersionId: s.policyVersionId,
      decisionTraceId: s.decisionTraceId,
      status: s.status as unknown as EligibilityStatus,
      results: (s.results || []).map((r) => ({
        policyId: r.policyId,
        policyNumber: 'PM_KISAN-DOC-001',
        policyTitle: 'PM Kisan Guidelines',
        status: r.status as unknown as EligibilityStatus,
        passedRules: (r.passedRules as string[]) || [],
        failedRules: (r.failedRules as string[]) || [],
        skippedRules: (r.skippedRules as string[]) || [],
        humanExplanation: r.humanExplanation,
        technicalExplanation: r.technicalExplanation,
      })),
      benefitAnalysis: s.benefitAnalysis
        ? {
            id: s.benefitAnalysis.id,
            totalMonetaryValue: s.benefitAnalysis.totalMonetaryValue,
            recurringMonthlyValue: s.benefitAnalysis.recurringMonthlyValue,
            oneTimeGrantValue: s.benefitAnalysis.oneTimeGrantValue,
            urgencyLevel: s.benefitAnalysis.urgencyLevel,
            applicationDeadline: s.benefitAnalysis.applicationDeadline?.toISOString(),
          }
        : null,
      opportunityAnalysis: s.opportunityAnalysis
        ? {
            id: s.opportunityAnalysis.id,
            gapType: s.opportunityAnalysis.gapType as unknown as OpportunityGapType,
            description: s.opportunityAnalysis.description,
            requiredAction: s.opportunityAnalysis.requiredAction,
            potentialBenefitAmount: s.opportunityAnalysis.potentialBenefitAmount,
            gapValue: s.opportunityAnalysis.gapValue,
          }
        : null,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
