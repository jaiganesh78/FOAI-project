import { PrismaClient } from '@prisma/client';
import { runAllSeeders } from './seeds';

const prisma = new PrismaClient();

async function main() {
  await runAllSeeders(prisma);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Database Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
