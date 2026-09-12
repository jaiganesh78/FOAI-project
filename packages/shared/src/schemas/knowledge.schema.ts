import { z } from 'zod';
import { KnowledgeSourceType, CrawlStrategy } from '../enums/knowledge.enum';

export const createKnowledgeSourceSchema = z.object({
  code: z.string().min(2, { message: 'Source code must be at least 2 characters' }),
  name: z.string().min(3, { message: 'Source name is required' }),
  sourceType: z.nativeEnum(KnowledgeSourceType).optional().default(KnowledgeSourceType.PORTAL),
  baseUrl: z.string().url({ message: 'Valid base URL is required' }),
  crawlStrategy: z.nativeEnum(CrawlStrategy).optional().default(CrawlStrategy.CRON_SCHEDULE),
  updateFrequencyCron: z.string().optional().default('0 0 * * *'),
  priority: z.number().int().optional().default(1),
  capabilities: z
    .object({
      supportsDownload: z.boolean().optional().default(true),
      supportsApi: z.boolean().optional().default(false),
      supportsHtmlScraping: z.boolean().optional().default(true),
      supportsPdf: z.boolean().optional().default(true),
      supportsIncrementalSync: z.boolean().optional().default(true),
      supportsVersionDetection: z.boolean().optional().default(true),
      supportsAuthentication: z.boolean().optional().default(false),
    })
    .optional(),
});

export const updateKnowledgeSourceSchema = createKnowledgeSourceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceSchema>;
export type UpdateKnowledgeSourceInput = z.infer<typeof updateKnowledgeSourceSchema>;
