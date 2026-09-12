import { PrismaClient } from '@prisma/client';

export async function seedDocumentModule(prisma: PrismaClient) {
  console.log('Seeding Document Module (OCR Templates & Verification Actors)...');

  // Seed Default OCR Templates
  await prisma.oCRTemplate.upsert({
    where: { templateCode: 'TPL_INCOME_CERT_V1' },
    update: {},
    create: {
      templateCode: 'TPL_INCOME_CERT_V1',
      name: 'Standard State Income Certificate',
      documentType: 'INCOME_CERTIFICATE',
      rulesJson: {
        keywords: ['Income Certificate', 'Annual Income', 'Tahshildar', 'Revenue Department'],
        keyMappings: {
          'Annual Income': 'annualIncome',
          'Certificate Number': 'incomeCertificateNumber',
          'Issue Date': 'incomeCertificateIssueDate',
        },
      },
    },
  });

  await prisma.oCRTemplate.upsert({
    where: { templateCode: 'TPL_AADHAAR_CARD_V1' },
    update: {},
    create: {
      templateCode: 'TPL_AADHAAR_CARD_V1',
      name: 'Government UIDAI Aadhaar Card',
      documentType: 'IDENTITY_PROOF',
      rulesJson: {
        keywords: ['Unique Identification Authority of India', 'Aadhaar', 'DOB'],
        keyMappings: {
          Aadhaar: 'aadhaarNumber',
          DOB: 'dateOfBirth',
          Gender: 'gender',
        },
      },
    },
  });

  // Seed Default Verification Actors
  await prisma.verificationActor.upsert({
    where: { actorCode: 'ACTOR_DIGILOCKER_API' },
    update: {},
    create: {
      actorCode: 'ACTOR_DIGILOCKER_API',
      name: 'DigiLocker Verification API',
      actorType: 'GOVERNMENT_API',
      trustRate: 1.0,
    },
  });

  await prisma.verificationActor.upsert({
    where: { actorCode: 'ACTOR_UIDAI_API' },
    update: {},
    create: {
      actorCode: 'ACTOR_UIDAI_API',
      name: 'UIDAI Aadhaar Verification API',
      actorType: 'GOVERNMENT_API',
      trustRate: 1.0,
    },
  });

  console.log('Document Module Seeding Completed.');
}
