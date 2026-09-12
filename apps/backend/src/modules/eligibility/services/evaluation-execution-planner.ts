import { Injectable, Logger } from '@nestjs/common';
import { CompiledRuleTree } from './compiled-rule-cache.service';

export interface PlannedRuleExecutionStep {
  stepIndex: number;
  compiledRule: CompiledRuleTree;
  dependencies: string[];
  costWeight: number;
}

@Injectable()
export class EvaluationExecutionPlanner {
  private readonly logger = new Logger(EvaluationExecutionPlanner.name);

  planExecution(rules: CompiledRuleTree[]): PlannedRuleExecutionStep[] {
    const costMap: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    // Sort rules by estimated evaluation cost (LOW cost first for short-circuiting)
    const sorted = [...rules].sort((a, b) => {
      const costA = costMap[a.estimatedCost] || 1;
      const costB = costMap[b.estimatedCost] || 1;
      return costA - costB;
    });

    this.logger.log(`Created optimized execution plan for ${sorted.length} rules ordered by evaluation cost.`);

    return sorted.map((compiledRule, index) => ({
      stepIndex: index + 1,
      compiledRule,
      dependencies: [],
      costWeight: costMap[compiledRule.estimatedCost] || 1,
    }));
  }
}
