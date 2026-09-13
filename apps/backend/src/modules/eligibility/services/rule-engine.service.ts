import { Inject, Injectable, Optional } from '@nestjs/common';
import { CompiledRuleTree, ExecutableRuleGroup, ExecutableRuleCondition } from './compiled-rule-cache.service';
import { RuleOperator, LogicalGroupOperator, AttributeDataType } from '@gpios/shared';
import { SEMANTIC_REGISTRY_SERVICE } from '../../../core/tokens/injection-tokens';
import { SemanticRegistryService } from '../../../core/semantic/semantic-registry.service';

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
  private readonly semanticRegistry: SemanticRegistryService;

  constructor(
    @Optional()
    @Inject(SEMANTIC_REGISTRY_SERVICE)
    semanticRegistry?: SemanticRegistryService,
  ) {
    this.semanticRegistry = semanticRegistry || new SemanticRegistryService();
  }

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
      const { isPassed: res, resolvedValue } = this.evaluateCondition(cond, facts);
      logs.push({
        conditionId: cond.id,
        attributeKey: cond.attributeKey,
        isPassed: res,
        actualValue: resolvedValue,
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

  private evaluateCondition(
    cond: ExecutableRuleCondition,
    facts: Record<string, unknown>,
  ): { isPassed: boolean; resolvedValue: unknown } {
    let rawActual = facts[cond.attributeKey];

    // Canonical / Legacy Bridge: If direct key lookup is undefined, resolve canonical <-> legacy mapping
    const canonicalAttr = this.semanticRegistry.getCanonicalAttribute(cond.attributeKey);
    if (rawActual === undefined && canonicalAttr) {
      // 1. Try any registered legitimate legacyAttributeKeys
      for (const legacyKey of canonicalAttr.legacyAttributeKeys) {
        if (facts[legacyKey] !== undefined) {
          rawActual = facts[legacyKey];
          break;
        }
      }
      // 2. Try canonical code if condition used a legacy key
      if (rawActual === undefined && facts[canonicalAttr.code] !== undefined) {
        rawActual = facts[canonicalAttr.code];
      }
    }

    if (rawActual === undefined || rawActual === null) {
      return {
        isPassed: cond.operator === RuleOperator.NOT_EXISTS,
        resolvedValue: null,
      };
    }

    // Extract value and potential unit from structured fact (e.g. { value: 2.5, unit: 'ACRE' })
    let actual: unknown = rawActual;
    let actualUnit: string | undefined;

    if (typeof rawActual === 'object' && rawActual !== null && !Array.isArray(rawActual)) {
      const obj = rawActual as Record<string, unknown>;
      if ('value' in obj) {
        actual = obj.value;
        if (typeof obj.unit === 'string') actualUnit = obj.unit;
      } else if ('normalizedValue' in obj) {
        actual = obj.normalizedValue;
        if (typeof obj.unit === 'string') actualUnit = obj.unit;
      }
    }

    // Also check companion unit in facts if not directly on fact object
    if (!actualUnit) {
      const companionUnit = facts[`${cond.attributeKey}Unit`] || facts['landAreaUnit'] || facts['incomeUnit'];
      if (typeof companionUnit === 'string') {
        actualUnit = companionUnit;
      }
    }

    // Target unit from condition or canonical attribute default unit
    const targetUnit = cond.expectedUnit || canonicalAttr?.canonicalUnit;

    // Unit conversion if measurable and units differ
    if (
      typeof actual === 'number' &&
      actualUnit &&
      targetUnit &&
      actualUnit.toUpperCase() !== targetUnit.toUpperCase()
    ) {
      const conv = this.semanticRegistry.convertUnit(actual, actualUnit, targetUnit);
      if (conv.success && conv.convertedValue !== undefined) {
        actual = conv.convertedValue;
      }
    }

    // Categorical Canonical Resolution: If attribute is an ENUM with controlled values, resolve actual alias
    if (canonicalAttr && canonicalAttr.dataType === AttributeDataType.ENUM && typeof actual === 'string') {
      const resolution = this.semanticRegistry.resolveCanonicalValue(canonicalAttr.code, actual);
      if (resolution.resolved && resolution.canonicalValue !== undefined) {
        actual = resolution.canonicalValue;
      }
    }

    const expected = cond.expectedValue;
    const isPassed = this.applyOperator(cond.operator, actual, expected);

    return { isPassed, resolvedValue: actual };
  }

  private applyOperator(operator: string, actual: unknown, expected: unknown): boolean {
    switch (operator) {
      case RuleOperator.EQUALS:
        return String(actual) === String(expected);
      case RuleOperator.NOT_EQUALS:
        return String(actual) !== String(expected);
      case RuleOperator.GREATER_THAN: {
        const a = Number(actual);
        const e = Number(expected);
        if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
        return a > e;
      }
      case RuleOperator.LESS_THAN: {
        const a = Number(actual);
        const e = Number(expected);
        if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
        return a < e;
      }
      case RuleOperator.GREATER_OR_EQUAL: {
        const a = Number(actual);
        const e = Number(expected);
        if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
        return a >= e;
      }
      case RuleOperator.LESS_OR_EQUAL: {
        const a = Number(actual);
        const e = Number(expected);
        if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
        return a <= e;
      }
      case RuleOperator.BETWEEN: {
        if (Array.isArray(expected) && expected.length === 2) {
          const val = Number(actual);
          const min = Number(expected[0]);
          const max = Number(expected[1]);
          if (!Number.isFinite(val) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
          return val >= min && val <= max;
        }
        return false;
      }
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
