import { PrismaClient } from '@prisma/client';

export async function seedCitizenKnowledgeModule(prisma: PrismaClient) {
  console.log('Seeding Citizen Knowledge & Adaptive Onboarding Module...');

  // 1. Seed Default Fact Freshness Policies
  await prisma.factFreshnessPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'annualIncome', version: 1 } },
    update: {},
    create: {
      attributeKey: 'annualIncome',
      category: 'FINANCIAL',
      expiryDurationDays: 365,
      warningWindowDays: 30,
      version: 1,
    },
  });

  await prisma.factFreshnessPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'residenceState', version: 1 } },
    update: {},
    create: {
      attributeKey: 'residenceState',
      category: 'DEMOGRAPHIC',
      expiryDurationDays: 365,
      warningWindowDays: 30,
      version: 1,
    },
  });

  await prisma.factFreshnessPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'occupationCategory', version: 1 } },
    update: {},
    create: {
      attributeKey: 'occupationCategory',
      category: 'OCCUPATION',
      expiryDurationDays: 180,
      warningWindowDays: 30,
      version: 1,
    },
  });

  await prisma.factFreshnessPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'bankAccountNumber', version: 1 } },
    update: {},
    create: {
      attributeKey: 'bankAccountNumber',
      category: 'FINANCIAL',
      expiryDurationDays: 365,
      warningWindowDays: 30,
      version: 1,
    },
  });

  // 2. Seed Default Question Prioritization Config
  await prisma.questionPrioritizationConfig.upsert({
    where: { id: 'default-prioritization-config-v1' },
    update: {},
    create: {
      id: 'default-prioritization-config-v1',
      version: 1,
      eligibilityRelevanceWeight: 0.35,
      recommendationUnlockWeight: 0.25,
      criticalFactImpactWeight: 0.20,
      downstreamDependencyWeight: 0.15,
      citizenEffortPenaltyWeight: 0.05,
      isActive: true,
    },
  });

  // 3. Seed Default Onboarding Questions & Immutable Versions
  const qIncome = await prisma.onboardingQuestion.upsert({
    where: { questionCode: 'Q_ANNUAL_INCOME' },
    update: {},
    create: {
      questionCode: 'Q_ANNUAL_INCOME',
      attributeKey: 'annualIncome',
      priority: 10,
      displayOrder: 1,
    },
  });

  await prisma.onboardingQuestionVersion.upsert({
    where: { questionId_version: { questionId: qIncome.id, version: 1 } },
    update: {},
    create: {
      questionId: qIncome.id,
      version: 1,
      questionText: 'What is your annual household income (in INR)?',
      helpText: 'Enter total annual gross income from all sources.',
      inputType: 'NUMBER' as any,
      isRequired: true,
      explanationTemplate: 'Required to determine eligibility for low-income & farmer financial support schemes.',
    },
  });

  const qLand = await prisma.onboardingQuestion.upsert({
    where: { questionCode: 'Q_LAND_OWNERSHIP' },
    update: {},
    create: {
      questionCode: 'Q_LAND_OWNERSHIP',
      attributeKey: 'isLandOwner',
      priority: 20,
      displayOrder: 2,
    },
  });

  await prisma.onboardingQuestionVersion.upsert({
    where: { questionId_version: { questionId: qLand.id, version: 1 } },
    update: {},
    create: {
      questionId: qLand.id,
      version: 1,
      questionText: 'Do you or your family own agricultural land?',
      helpText: 'Select Yes if you hold registered agricultural land titles.',
      inputType: 'BOOLEAN' as any,
      isRequired: true,
      explanationTemplate: 'Required to evaluate eligibility for PM-KISAN and crop insurance programs.',
    },
  });

  console.log('Citizen Knowledge & Adaptive Onboarding Module Seeding Completed.');
}
