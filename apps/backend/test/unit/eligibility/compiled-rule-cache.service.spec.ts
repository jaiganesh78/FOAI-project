import { describe, it, expect } from 'vitest';
import { CompiledRuleCacheService } from '../../../src/modules/eligibility/services/compiled-rule-cache.service';
import { LogicalGroupOperator, RuleOperator, RuleEvaluationCost } from '@gpios/shared';

describe('CompiledRuleCacheService', () => {
  const service = new CompiledRuleCacheService();

  it('should compile rule version and hit cache on subsequent call', () => {
    const mockRule = {
      id: 'rule-1',
      ruleCode: 'RULE_PM_KISAN_LAND',
      estimatedCost: RuleEvaluationCost.LOW,
      versions: [
        {
          id: 'rv-1',
          versionNumber: 1,
          logicFingerprint: 'landHolding_lte_2',
          isCurrent: true,
          groups: [
            {
              id: 'g-1',
              logicalOperator: LogicalGroupOperator.ALL,
              conditions: [
                {
                  id: 'c-1',
                  attributeKey: 'landHolding',
                  operator: RuleOperator.LESS_OR_EQUAL,
                  expectedValue: 2.0,
                  estimatedCost: RuleEvaluationCost.LOW,
                },
              ],
            },
          ],
        },
      ],
    };

    const firstCall = service.getCompiledRule(mockRule as any);
    expect(firstCall.isHit).toBe(false);
    expect(firstCall.compiled.ruleCode).toBe('RULE_PM_KISAN_LAND');

    const secondCall = service.getCompiledRule(mockRule as any);
    expect(secondCall.isHit).toBe(true);

    const metrics = service.getCacheMetrics();
    expect(metrics.hits).toBe(1);
    expect(metrics.misses).toBe(1);
  });
});
