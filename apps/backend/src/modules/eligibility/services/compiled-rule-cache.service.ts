import { Injectable, Logger } from '@nestjs/common';
import { PolicyRuleWithVersion } from '../repositories/policy-rule.repository.interface';
import { RuleCondition, RuleGroup, PolicyRuleVersion } from '@prisma/client';

export interface ExecutableRuleCondition {
  id: string;
  attributeKey: string;
  operator: string;
  expectedValue: unknown;
  estimatedCost: string;
  expectedUnit?: string;
}

export interface ExecutableRuleGroup {
  id: string;
  logicalOperator: string;
  thresholdX?: number | null;
  conditions: ExecutableRuleCondition[];
  childGroups: ExecutableRuleGroup[];
}

export interface CompiledRuleTree {
  ruleId: string;
  ruleCode: string;
  ruleVersionId: string;
  versionNumber: number;
  logicFingerprint: string;
  estimatedCost: string;
  rootGroup: ExecutableRuleGroup;
}

interface GroupWithRelations extends RuleGroup {
  conditions: RuleCondition[];
  childGroups?: GroupWithRelations[];
}

interface VersionWithGroups extends PolicyRuleVersion {
  groups: GroupWithRelations[];
}

@Injectable()
export class CompiledRuleCacheService {
  private readonly logger = new Logger(CompiledRuleCacheService.name);
  private readonly cache = new Map<string, CompiledRuleTree>();
  private cacheHits = 0;
  private cacheMisses = 0;

  getCompiledRule(rule: PolicyRuleWithVersion): { compiled: CompiledRuleTree; isHit: boolean } {
    const currentVersion = rule.versions.find((v) => v.isCurrent) || rule.versions[0];
    if (!currentVersion) {
      throw new Error(`Rule ${rule.ruleCode} has no valid versions to compile.`);
    }

    const cacheKey = `${rule.ruleCode}:${currentVersion.id}:${currentVersion.logicFingerprint}`;
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return { compiled: this.cache.get(cacheKey)!, isHit: true };
    }

    this.cacheMisses++;
    const compiled = this.compileRuleVersion(rule, currentVersion as unknown as VersionWithGroups);
    this.cache.set(cacheKey, compiled);
    this.logger.log(`Compiled rule version ${currentVersion.versionNumber} for ${rule.ruleCode} into cache.`);
    return { compiled, isHit: false };
  }

  invalidateCache(): void {
    this.cache.clear();
    this.logger.log('Compiled Rule Cache cleared.');
  }

  getCacheMetrics(): { hits: number; misses: number; size: number } {
    return { hits: this.cacheHits, misses: this.cacheMisses, size: this.cache.size };
  }

  private compileRuleVersion(rule: PolicyRuleWithVersion, version: VersionWithGroups): CompiledRuleTree {
    const groups = version.groups || [];
    const rootGroupData = groups.find((g) => !g.parentGroupId) || groups[0];

    const compileGroup = (group: GroupWithRelations): ExecutableRuleGroup => {
      return {
        id: group.id,
        logicalOperator: group.logicalOperator,
        thresholdX: group.thresholdX,
        conditions: (group.conditions || []).map((c) => ({
          id: c.id,
          attributeKey: c.attributeKey,
          operator: c.operator,
          expectedValue: c.expectedValue,
          estimatedCost: c.estimatedCost || 'LOW',
        })),
        childGroups: (group.childGroups || []).map(compileGroup),
      };
    };

    return {
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      ruleVersionId: version.id,
      versionNumber: version.versionNumber,
      logicFingerprint: version.logicFingerprint,
      estimatedCost: rule.estimatedCost || 'LOW',
      rootGroup: compileGroup(rootGroupData),
    };
  }
}
