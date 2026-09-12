import { Injectable } from '@nestjs/common';
import { CompiledRuleTree, ExecutableRuleGroup, ExecutableRuleCondition } from './compiled-rule-cache.service';
import { RuleOperator, LogicalGroupOperator } from '@gpios/shared';

export interface RuleEvaluationResult {
  ruleCode: string;
  ruleVersionId: string;
  isPassed: boolean;
  evaluatedConditionsCount: number;
  passedConditionsCount: number;
  failedConditionsCount: number;
  conditionLogs: { conditionId: string; attributeKey: string; isPassed: boolean; actualValue: unknown }[];
}

@Injectable()
export class RuleEngineService {
  evaluateRule(ruleTree: CompiledRuleTree, citizenFacts: Record<string, unknown>): RuleEvaluationResult {
    const logs: { conditionId: string; attributeKey: string; isPassed: boolean; actualValue: unknown }[] = [];

    const isPassed = this.evaluateGroup(ruleTree.rootGroup, citizenFacts, logs);

    const evaluatedConditionsCount = logs.length;
    const passedConditionsCount = logs.filter((l) => l.isPassed).length;
    const failedConditionsCount = evaluatedConditionsCount - passedConditionsCount;

    return {
      ruleCode: ruleTree.ruleCode,
      ruleVersionId: ruleTree.ruleVersionId,
      isPassed,
      evaluatedConditionsCount,
      passedConditionsCount,
      failedConditionsCount,
      conditionLogs: logs,
    };
  }

  private evaluateGroup(
    group: ExecutableRuleGroup,
    facts: Record<string, unknown>,
    logs: { conditionId: string; attributeKey: string; isPassed: boolean; actualValue: unknown }[],
  ): boolean {
    const conditionResults: boolean[] = [];

    for (const cond of group.conditions) {
      const res = this.evaluateCondition(cond, facts);
      logs.push({
        conditionId: cond.id,
        attributeKey: cond.attributeKey,
        isPassed: res,
        actualValue: facts[cond.attributeKey],
      });
      conditionResults.push(res);
    }

    for (const childGroup of group.childGroups) {
      const res = this.evaluateGroup(childGroup, facts, logs);
      conditionResults.push(res);
    }

    if (conditionResults.length === 0) return true;

    switch (group.logicalOperator) {
      case LogicalGroupOperator.ALL:
        return conditionResults.every(Boolean);
      case LogicalGroupOperator.ANY:
        return conditionResults.some(Boolean);
      case LogicalGroupOperator.NONE:
        return conditionResults.every((r) => !r);
      case LogicalGroupOperator.X_OF_Y:
        const count = conditionResults.filter(Boolean).length;
        return count >= (group.thresholdX || 1);
      default:
        return conditionResults.every(Boolean);
    }
  }

  private evaluateCondition(cond: ExecutableRuleCondition, facts: Record<string, unknown>): boolean {
    const actual = facts[cond.attributeKey];
    const expected = cond.expectedValue;

    if (actual === undefined || actual === null) {
      return cond.operator === RuleOperator.NOT_EXISTS;
    }

    switch (cond.operator) {
      case RuleOperator.EQUALS:
        return String(actual) === String(expected);
      case RuleOperator.NOT_EQUALS:
        return String(actual) !== String(expected);
      case RuleOperator.GREATER_THAN:
        return Number(actual) > Number(expected);
      case RuleOperator.LESS_THAN:
        return Number(actual) < Number(expected);
      case RuleOperator.GREATER_OR_EQUAL:
        return Number(actual) >= Number(expected);
      case RuleOperator.LESS_OR_EQUAL:
        return Number(actual) <= Number(expected);
      case RuleOperator.BETWEEN:
        if (Array.isArray(expected) && expected.length === 2) {
          const val = Number(actual);
          return val >= Number(expected[0]) && val <= Number(expected[1]);
        }
        return false;
      case RuleOperator.IN:
        return Array.isArray(expected) ? expected.map(String).includes(String(actual)) : false;
      case RuleOperator.NOT_IN:
        return Array.isArray(expected) ? !expected.map(String).includes(String(actual)) : true;
      case RuleOperator.EXISTS:
        return true;
      case RuleOperator.NOT_EXISTS:
        return false;
      case RuleOperator.REGEX:
        return new RegExp(String(expected), 'i').test(String(actual));
      case RuleOperator.BOOLEAN:
        return Boolean(actual) === Boolean(expected);
      default:
        return false;
    }
  }
}
