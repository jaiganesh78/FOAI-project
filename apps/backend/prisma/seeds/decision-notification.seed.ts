import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

export async function seedDecisionNotificationModule(prisma: PrismaClient) {
  console.log('Seeding Enterprise Communication & Citizen Action Center Module...');

  // Seed Default Policy Version
  const policyPayload = {
    policyId: 'pol-notification-default',
    version: 1,
    minMaterialityLevel: 'MEDIUM',
    cooldownWindowSeconds: 300,
    maxPerWindow: 3,
    allowedChannels: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
    fallbackPrecedence: ['IN_APP', 'PUSH', 'EMAIL', 'SMS'],
  };
  const policyChecksumSha256 = createHash('sha256').update(JSON.stringify(policyPayload)).digest('hex');

  await prisma.notificationPolicyVersion.upsert({
    where: { policyId_version: { policyId: 'pol-notification-default', version: 1 } },
    update: {},
    create: {
      policyId: 'pol-notification-default',
      version: 1,
      minMaterialityLevel: policyPayload.minMaterialityLevel,
      cooldownWindowSeconds: policyPayload.cooldownWindowSeconds,
      maxPerWindow: policyPayload.maxPerWindow,
      allowedChannels: policyPayload.allowedChannels,
      fallbackPrecedence: policyPayload.fallbackPrecedence,
      checksumSha256: policyChecksumSha256,
      activatedBy: 'system-admin',
    },
  });

  // Seed Default Template Version
  const templatePayload = {
    templateId: 'tmpl-eligibility-change',
    version: 1,
    locale: 'en-IN',
    titleTemplate: 'Eligibility Update for {{policyTitle}}',
    bodyTemplate: 'Dear Citizen, your eligibility status for {{policyTitle}} has changed to {{newStatus}}. Sign in to review details.',
    actionUrlTemplate: '/action-center/review/{{reEvaluationId}}',
  };
  const templateChecksumSha256 = createHash('sha256').update(JSON.stringify(templatePayload)).digest('hex');

  await prisma.notificationTemplateVersion.upsert({
    where: { templateId_version_locale: { templateId: 'tmpl-eligibility-change', version: 1, locale: 'en-IN' } },
    update: {},
    create: {
      templateId: 'tmpl-eligibility-change',
      version: 1,
      locale: 'en-IN',
      titleTemplate: templatePayload.titleTemplate,
      bodyTemplate: templatePayload.bodyTemplate,
      actionUrlTemplate: templatePayload.actionUrlTemplate,
      checksumSha256: templateChecksumSha256,
      createdBy: 'system-admin',
    },
  });

  console.log('Enterprise Communication Module Seeding Completed.');
}
