import { describe, it, expect } from 'vitest';
import { RuleEngineService } from '../../../src/modules/eligibility/services/rule-engine.service';
import { RuleOperator, LogicalGroupOperator } from '@gpios/shared';

describe('RuleEngineService', () => {
  const service = new RuleEngineService();

  it('should evaluate rule with LESS_OR_EQUAL operator against citizen facts', () => {
    const compiledRule = {
      ruleId: 'r-1',
      ruleCode: 'RULE_PM_KISAN_LAND',
      ruleVersionId: 'rv-1',
      versionNumber: 1,
      logicFingerprint: 'fingerprint-1',
      estimatedCost: 'LOW',
      rootGroup: {
        id: 'g-1',
        logicalOperator: LogicalGroupOperator.ALL,
        conditions: [
          {
            id: 'c-1',
            attributeKey: 'landHolding',
            operator: RuleOperator.LESS_OR_EQUAL,
            expectedValue: 2.0,
            estimatedCost: 'LOW',
          },
        ],
        childGroups: [],
      },
    };

    const resultPass = service.evaluateRule(compiledRule as any, { landHolding: 1.5 });
    expect(resultPass.isPassed).toBe(true);

    const resultFail = service.evaluateRule(compiledRule as any, { landHolding: 3.5 });
    expect(resultFail.isPassed).toBe(false);
  });
});
