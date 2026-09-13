import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidSchema = z.string().uuid();

export * from './document.schema';
export * from './citizen-profile.schema';
export * from './fact-verification.schema';
export * from './decision-re-evaluation.schema';
export * from './notification.schema';
export * from './semantic.schema';
export * from './candidate-retrieval.schema';
