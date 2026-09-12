import { PrismaClient } from '@prisma/client';

export async function seedRecommendations(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding Recommendation Scheme Dependencies...');

  const dependencies = [
    {
      sourcePolicyId: 'pol-pm-kisan-1',
      targetPolicyId: 'pol-land-records-1',
      dependencyType: 'REQUIRES',
    },
    {
      sourcePolicyId: 'pol-pm-kisan-1',
      targetPolicyId: 'pol-crop-insurance-1',
      dependencyType: 'UNLOCKS',
    },
  ];

  for (const dep of dependencies) {
    await prisma.recommendationDependency.upsert({
      where: {
        sourcePolicyId_targetPolicyId_dependencyType: {
          sourcePolicyId: dep.sourcePolicyId,
          targetPolicyId: dep.targetPolicyId,
          dependencyType: dep.dependencyType,
        },
      },
      update: {},
      create: dep,
    });
  }

  // eslint-disable-next-line no-console
  console.log('Recommendation Scheme Dependencies seeded successfully.');
}
