import { PrismaClient } from '@prisma/client';
import { seedRolesAndPermissions } from './role-permission.seed';
import { seedCitizenAttributeRegistry } from './citizen-attribute.seed';
import { seedOnboardingDiscovery } from './onboarding-discovery.seed';
import { seedKnowledgeSources } from './knowledge-source.seed';
import { seedPolicyRules } from './policy-rule.seed';
import { seedRecommendations } from './recommendation.seed';
import { seedJourneyBlueprints } from './journey.seed';
import { seedDocumentModule } from './document.seed';
import { seedCitizenKnowledgeModule } from './citizen-knowledge.seed';
import { seedFactVerificationModule } from './fact-verification.seed';
import { seedDecisionReEvaluationModule } from './decision-re-evaluation.seed';
import { seedDecisionNotificationModule } from './decision-notification.seed';

export async function runAllSeeders(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Executing modular seed registry...');
  await seedRolesAndPermissions(prisma);
  await seedCitizenAttributeRegistry(prisma);
  await seedOnboardingDiscovery(prisma);
  await seedKnowledgeSources(prisma);
  await seedPolicyRules(prisma);
  await seedRecommendations(prisma);
  await seedJourneyBlueprints(prisma);
  await seedDocumentModule(prisma);
  await seedCitizenKnowledgeModule(prisma);
  await seedFactVerificationModule(prisma);
  await seedDecisionReEvaluationModule(prisma);
  await seedDecisionNotificationModule(prisma);
  // eslint-disable-next-line no-console
  console.log('All modular seeders completed successfully.');
}
