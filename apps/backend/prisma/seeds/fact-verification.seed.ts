import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

export async function seedFactVerificationModule(prisma: PrismaClient) {
  console.log('Seeding Fact Verification & Evidence Reconciliation Module...');

  const policyPayload = {
    attributeKey: 'annualIncome',
    acceptableSources: ['GOVERNMENT_VERIFIED', 'MANUAL_OFFICER_VERIFIED', 'DOCUMENT_DERIVED'],
    minimumTrustScore: 70.0,
    freshnessExpiryDurationDays: 365,
    requireManualReviewForGovernmentExpired: true,
    requireManualReviewForConflicts: true,
  };

  const checksumSha256 = createHash('sha256').update(JSON.stringify(policyPayload)).digest('hex');

  await prisma.factVerificationPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'annualIncome', version: 1 } },
    update: {},
    create: {
      attributeKey: 'annualIncome',
      version: 1,
      acceptableSources: policyPayload.acceptableSources,
      minimumTrustScore: 70.0,
      freshnessExpiryDurationDays: 365,
      requireManualReviewForGovernmentExpired: true,
      requireManualReviewForConflicts: true,
      checksumSha256,
      isActive: true,
    },
  });

  const residencePayload = {
    attributeKey: 'residenceState',
    acceptableSources: ['GOVERNMENT_VERIFIED', 'MANUAL_OFFICER_VERIFIED', 'DOCUMENT_DERIVED'],
    minimumTrustScore: 70.0,
    freshnessExpiryDurationDays: 365,
    requireManualReviewForGovernmentExpired: true,
    requireManualReviewForConflicts: true,
  };

  const resChecksum = createHash('sha256').update(JSON.stringify(residencePayload)).digest('hex');

  await prisma.factVerificationPolicy.upsert({
    where: { attributeKey_version: { attributeKey: 'residenceState', version: 1 } },
    update: {},
    create: {
      attributeKey: 'residenceState',
      version: 1,
      acceptableSources: residencePayload.acceptableSources,
      minimumTrustScore: 70.0,
      freshnessExpiryDurationDays: 365,
      requireManualReviewForGovernmentExpired: true,
      requireManualReviewForConflicts: true,
      checksumSha256: resChecksum,
      isActive: true,
    },
  });

  console.log('Fact Verification & Evidence Reconciliation Module Seeding Completed.');
}
