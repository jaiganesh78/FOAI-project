import { PrismaClient } from '@prisma/client';

export async function seedJourneyBlueprints(prisma: PrismaClient) {
  // 1. Root Parent Template
  const rootBlueprint = await prisma.journeyBlueprint.upsert({
    where: { id: 'bp-root-benefit-app' },
    update: {},
    create: {
      id: 'bp-root-benefit-app',
      policyId: 'pol-root',
      policyTitle: 'Government Benefit Application',
      name: 'Base Government Benefit Journey',
      description: 'Root parent template for all government benefit applications',
      version: 1,
    },
  });

  // 2. Domain Parent Template (Farmer Schemes)
  const farmerDomainBlueprint = await prisma.journeyBlueprint.upsert({
    where: { id: 'bp-domain-farmer' },
    update: {},
    create: {
      id: 'bp-domain-farmer',
      parentBlueprintId: rootBlueprint.id,
      policyId: 'pol-farmer-domain',
      policyTitle: 'Farmer Welfare Schemes Base',
      name: 'Farmer Welfare Application Journey Template',
      description: 'Domain template for agricultural welfare schemes',
      version: 1,
    },
  });

  // 3. Concrete Policy Blueprint (PM-KISAN)
  await prisma.journeyBlueprint.upsert({
    where: { id: 'bp-pm-kisan-v1' },
    update: {},
    create: {
      id: 'bp-pm-kisan-v1',
      parentBlueprintId: farmerDomainBlueprint.id,
      policyId: 'pol-pm-kisan-101',
      policyTitle: 'PM Kisan Samman Nidhi',
      name: 'PM-KISAN Direct Benefit Transfer Journey',
      description: 'Concrete application journey for PM-KISAN ₹6,000 annual transfer',
      version: 1,
    },
  });

  console.log('Seeded Journey Blueprints with inheritance (Root -> Farmer Domain -> PM-KISAN)');
}
