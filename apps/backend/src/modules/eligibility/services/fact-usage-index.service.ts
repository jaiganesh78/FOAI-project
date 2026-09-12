import { Injectable } from '@nestjs/common';
import { CompiledRuleTree, ExecutableRuleGroup } from './compiled-rule-cache.service';

@Injectable()
export class FactUsageIndexService {
  private readonly index = new Map<string, Set<string>>(); // attributeKey -> Set of ruleCodes

  buildIndex(compiledRules: CompiledRuleTree[]): void {
    this.index.clear();

    for (const rule of compiledRules) {
      this.collectAttributesFromGroup(rule.ruleCode, rule.rootGroup);
    }
  }

  getAffectedRuleCodes(changedAttributeKeys: string[]): string[] {
    const affected = new Set<string>();

    for (const key of changedAttributeKeys) {
      const rules = this.index.get(key);
      if (rules) {
        rules.forEach((r) => affected.add(r));
      }
    }

    return Array.from(affected);
  }

  private collectAttributesFromGroup(ruleCode: string, group: ExecutableRuleGroup): void {
    if (group.conditions) {
      for (const cond of group.conditions) {
        if (!this.index.has(cond.attributeKey)) {
          this.index.set(cond.attributeKey, new Set<string>());
        }
        this.index.get(cond.attributeKey)!.add(ruleCode);
      }
    }

    if (group.childGroups) {
      for (const child of group.childGroups) {
        this.collectAttributesFromGroup(ruleCode, child);
      }
    }
  }
}
