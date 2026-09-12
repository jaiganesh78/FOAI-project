import { Inject, Injectable } from '@nestjs/common';
import { DECISION_TRACE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionTraceRepository, DecisionTraceWithGraph } from '../repositories/decision-trace.repository.interface';
import { RuleEvaluationResult } from './rule-engine.service';
import { EvaluationGraphPayload } from './evaluation-graph.service';
import { EligibilityStatus } from '@gpios/shared';

@Injectable()
export class TraceStoreService {
  constructor(@Inject(DECISION_TRACE_REPOSITORY) private readonly traceRepository: IDecisionTraceRepository) {}

  async createTrace(params: {
    userId: string;
    citizenSnapshotId: string;
    policyVersionId: string;
    policyRuleVersionId: string;
    status: EligibilityStatus;
    executionDurationMs: number;
    correlationId: string;
    ruleResults: RuleEvaluationResult[];
    graph: EvaluationGraphPayload;
  }): Promise<DecisionTraceWithGraph> {
    const passed = params.ruleResults.filter((r) => r.isPassed).map((r) => r.ruleCode);
    const failed = params.ruleResults.filter((r) => !r.isPassed).map((r) => r.ruleCode);

    return this.traceRepository.createTrace({
      userId: params.userId,
      citizenSnapshotId: params.citizenSnapshotId,
      policyVersionId: params.policyVersionId,
      policyRuleVersionId: params.policyRuleVersionId,
      status: params.status,
      executionDurationMs: params.executionDurationMs,
      correlationId: params.correlationId,
      evaluatedRulesCount: params.ruleResults.length,
      passedRulesCount: passed.length,
      failedRulesCount: failed.length,
      skippedRulesCount: 0,
      nodes: params.graph.nodes,
      edges: params.graph.edges,
    });
  }

  async getTraceById(id: string): Promise<DecisionTraceWithGraph | null> {
    return this.traceRepository.findById(id);
  }

  async getTracesByUserId(userId: string): Promise<DecisionTraceWithGraph[]> {
    return this.traceRepository.findByUserId(userId);
  }
}
