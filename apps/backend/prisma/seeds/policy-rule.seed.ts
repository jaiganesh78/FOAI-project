import { PrismaClient, RuleOperator, LogicalGroupOperator, RuleEvaluationCost } from '@prisma/client';

export async function seedPolicyRules(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding Policy Rules & Explainability Templates...');

  // Seed default Explainability Templates
  const templates = [
    {
      code: 'EXPLAIN_ELIGIBLE_FARMER',
      templateText: 'Citizen is eligible for {{policy}} because land holding of {{landHolding}} hectares is below maximum threshold of {{threshold}} hectares.',
      locale: 'en-IN',
    },
    {
      code: 'EXPLAIN_INELIGIBLE_INCOME',
      templateText: 'Citizen is ineligible for {{policy}} because annual income of ₹{{income}} exceeds eligibility threshold of ₹{{threshold}} by ₹{{gapAmount}}.',
      locale: 'en-IN',
    },
  ];

  for (const t of templates) {
    await prisma.explainabilityTemplate.upsert({
      where: { code: t.code },
      update: { templateText: t.templateText, locale: t.locale },
      create: { code: t.code, templateText: t.templateText, locale: t.locale },
    });
  }

  // Find PM-KISAN active policy version
  const pmKisanDoc = await prisma.policyDocument.findFirst({ where: { documentNumber: { contains: 'PM_KISAN' } } });
  if (pmKisanDoc) {
    const version = await prisma.policyVersion.findFirst({ where: { documentId: pmKisanDoc.id, isCurrent: true } });
    if (version) {
      const rule = await prisma.policyRule.upsert({
        where: { ruleCode: 'RULE_PM_KISAN_LAND' },
        update: { name: 'PM-KISAN Small/Marginal Farmer Land Criteria', estimatedCost: RuleEvaluationCost.LOW },
        create: {
          policyVersionId: version.id,
          ruleCode: 'RULE_PM_KISAN_LAND',
          name: 'PM-KISAN Small/Marginal Farmer Land Criteria',
          estimatedCost: RuleEvaluationCost.LOW,
        },
      });

      const ruleVersion = await prisma.policyRuleVersion.upsert({
        where: { ruleId_versionNumber: { ruleId: rule.id, versionNumber: 1 } },
        update: { logicFingerprint: 'landHolding_lte_2' },
        create: {
          ruleId: rule.id,
          versionNumber: 1,
          logicFingerprint: 'landHolding_lte_2',
          isCurrent: true,
        },
      });

      const group = await prisma.ruleGroup.create({
        data: {
          ruleVersionId: ruleVersion.id,
          logicalOperator: LogicalGroupOperator.ALL,
        },
      });

      await prisma.ruleCondition.create({
        data: {
          groupId: group.id,
          attributeKey: 'landHolding',
          operator: RuleOperator.LESS_OR_EQUAL,
          expectedValue: 2.0,
          estimatedCost: RuleEvaluationCost.LOW,
          description: 'Land holding must be <= 2.0 hectares',
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Policy Rules & Explainability Templates seeded successfully.');
}
