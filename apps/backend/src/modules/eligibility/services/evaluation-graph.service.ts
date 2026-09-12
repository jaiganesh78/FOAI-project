import { Injectable } from '@nestjs/common';
import { RuleEvaluationResult } from './rule-engine.service';

export interface EvaluationGraphPayload {
  nodes: { nodeType: string; label: string; status: string; metadata?: Record<string, unknown> }[];
  edges: { sourceNodeId: string; targetNodeId: string; relationship: string }[];
}

@Injectable()
export class EvaluationGraphService {
  buildEvaluationGraph(results: RuleEvaluationResult[], facts: Record<string, unknown>): EvaluationGraphPayload {
    const nodes: { nodeType: string; label: string; status: string; metadata?: Record<string, unknown> }[] = [];
    const edges: { sourceNodeId: string; targetNodeId: string; relationship: string }[] = [];

    // Fact Nodes
    Object.entries(facts).forEach(([key, val]) => {
      nodes.push({
        nodeType: 'FACT',
        label: `${key}: ${String(val)}`,
        status: 'EVALUATED',
        metadata: { key, value: String(val) },
      });
    });

    // Rule Nodes & Edges
    results.forEach((r) => {
      const ruleNodeId = `RULE_${r.ruleCode}`;
      nodes.push({
        nodeType: 'RULE',
        label: r.ruleCode,
        status: r.isPassed ? 'PASSED' : 'FAILED',
        metadata: { passed: r.passedConditionsCount, failed: r.failedConditionsCount },
      });

      r.conditionLogs.forEach((log) => {
        const factNodeLabel = `${log.attributeKey}: ${String(log.actualValue)}`;
        edges.push({
          sourceNodeId: factNodeLabel,
          targetNodeId: ruleNodeId,
          relationship: 'EVALUATES',
        });
      });
    });

    return { nodes, edges };
  }
}
