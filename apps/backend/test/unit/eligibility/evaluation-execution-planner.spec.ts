import { describe, it, expect } from 'vitest';
import { EvaluationExecutionPlanner } from '../../../src/modules/eligibility/services/evaluation-execution-planner';

describe('EvaluationExecutionPlanner', () => {
  const planner = new EvaluationExecutionPlanner();

  it('should order rules by evaluation cost (LOW cost first for short-circuiting)', () => {
    const rules = [
      { ruleCode: 'RULE_HIGH', estimatedCost: 'HIGH' },
      { ruleCode: 'RULE_LOW', estimatedCost: 'LOW' },
      { ruleCode: 'RULE_MED', estimatedCost: 'MEDIUM' },
    ];

    const plan = planner.planExecution(rules as any);

    expect(plan.length).toBe(3);
    expect(plan[0].compiledRule.ruleCode).toBe('RULE_LOW');
    expect(plan[1].compiledRule.ruleCode).toBe('RULE_MED');
    expect(plan[2].compiledRule.ruleCode).toBe('RULE_HIGH');
  });
});
