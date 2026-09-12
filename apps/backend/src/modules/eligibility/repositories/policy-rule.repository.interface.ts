import { PolicyRule, PolicyRuleVersion, RuleGroup, RuleCondition } from '@prisma/client';

export interface PolicyRuleWithVersion extends PolicyRule {
  versions: (PolicyRuleVersion & {
    groups: (RuleGroup & {
      conditions: RuleCondition[];
      childGroups?: (RuleGroup & { conditions: RuleCondition[] })[];
    })[];
  })[];
}

export interface IPolicyRuleRepository {
  findById(id: string): Promise<PolicyRuleWithVersion | null>;
  findByRuleCode(ruleCode: string): Promise<PolicyRuleWithVersion | null>;
  findActiveRulesByPolicyVersionId(policyVersionId: string): Promise<PolicyRuleWithVersion[]>;
  findAllActiveRules(): Promise<PolicyRuleWithVersion[]>;
}
