import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

export async function seedDecisionReEvaluationModule(prisma: PrismaClient) {
  console.log('Seeding Continuous Decision Re-evaluation & Policy Change Intelligence Module...');

  const policyPayload = {
    policyId: 'pol-pm-kisan',
    policyTitle: 'PM Kisan Samman Nidhi Scheme Policy',
    version: 1,
    affectedFacts: ['annualIncome', 'isLandOwner', 'landAreaHectares'],
    affectedRules: ['rule-income-max-250k', 'rule-land-required'],
    affectedAttributeKeys: ['annualIncome', 'isLandOwner'],
  };

  const checksumSha256 = createHash('sha256').update(JSON.stringify(policyPayload)).digest('hex');

  await prisma.policyVersionActivation.upsert({
    where: { policyId_version: { policyId: 'pol-pm-kisan', version: 1 } },
    update: {},
    create: {
      policyId: 'pol-pm-kisan',
      policyTitle: policyPayload.policyTitle,
      version: 1,
      activationReason: 'Initial platform policy activation for PM-KISAN',
      checksumSha256,
      affectedFacts: policyPayload.affectedFacts,
      affectedRules: policyPayload.affectedRules,
      affectedAttributeKeys: policyPayload.affectedAttributeKeys,
      discoveredPopulationCount: 1,
      populationSelectionChecksum: createHash('sha256').update('seed-population').digest('hex'),
      activatedBy: 'system-admin',
    },
  });

  console.log('Continuous Decision Re-evaluation Module Seeding Completed.');
}
