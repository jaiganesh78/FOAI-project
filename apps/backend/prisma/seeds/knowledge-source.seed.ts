import { PrismaClient, KnowledgeSourceType, CrawlStrategy } from '@prisma/client';

export async function seedKnowledgeSources(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding Government Knowledge Sources...');

  const defaultCapabilities = {
    supportsDownload: true,
    supportsApi: true,
    supportsHtmlScraping: true,
    supportsPdf: true,
    supportsIncrementalSync: true,
    supportsVersionDetection: true,
    supportsAuthentication: false,
  };

  const sources = [
    {
      code: 'PM_KISAN',
      name: 'Pradhan Mantri Kisan Samman Nidhi Portal',
      sourceType: KnowledgeSourceType.PORTAL,
      baseUrl: 'https://pmkisan.gov.in',
      crawlStrategy: CrawlStrategy.CRON_SCHEDULE,
      updateFrequencyCron: '0 0 1 * *', // Monthly
      priority: 1,
      capabilities: defaultCapabilities,
    },
    {
      code: 'GAZETTE_INDIA',
      name: 'The Gazette of India',
      sourceType: KnowledgeSourceType.GAZETTE,
      baseUrl: 'https://egazette.gov.in',
      crawlStrategy: CrawlStrategy.CRON_SCHEDULE,
      updateFrequencyCron: '0 0 * * *', // Daily
      priority: 1,
      capabilities: defaultCapabilities,
    },
    {
      code: 'NSP_SCHOLARSHIP',
      name: 'National Scholarship Portal',
      sourceType: KnowledgeSourceType.SCHOLARSHIP,
      baseUrl: 'https://scholarships.gov.in',
      crawlStrategy: CrawlStrategy.CRON_SCHEDULE,
      updateFrequencyCron: '0 */6 * * *', // Every 6 hours
      priority: 2,
      capabilities: defaultCapabilities,
    },
  ];

  for (const s of sources) {
    await prisma.knowledgeSource.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        sourceType: s.sourceType,
        baseUrl: s.baseUrl,
        crawlStrategy: s.crawlStrategy,
        updateFrequencyCron: s.updateFrequencyCron,
        capabilities: s.capabilities,
        priority: s.priority,
      },
      create: {
        code: s.code,
        name: s.name,
        sourceType: s.sourceType,
        baseUrl: s.baseUrl,
        crawlStrategy: s.crawlStrategy,
        updateFrequencyCron: s.updateFrequencyCron,
        capabilities: s.capabilities,
        priority: s.priority,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Government Knowledge Sources seeded successfully.');
}
