import { z } from 'zod';

export const candidateRetrievalConstraintsSchema = z.object({
  state: z.string().min(1).max(100).optional(),
  policyClassification: z.string().min(1).max(50).optional(),
  beneficiaryCategory: z.string().min(1).max(50).optional(),
  ministry: z.string().min(1).max(100).optional(),
  department: z.string().min(1).max(100).optional(),
  maxCandidates: z.number().int().min(1).max(50).default(10),
  minScore: z.number().min(0).max(1).default(0.1),
});

export const candidateRetrievalRequestSchema = z.object({
  citizenContext: z.object({
    userId: z.string().optional(),
    authoritativeCitizenFacts: z.record(z.unknown()).optional(),
    retrievalHints: z.record(z.unknown()).optional(),
    facts: z.record(z.unknown()).optional(),
  }).strict(),
  searchQuery: z.string().max(500).optional(),
  constraints: candidateRetrievalConstraintsSchema.optional(),
  mode: z.enum(['STRUCTURED_ONLY', 'HYBRID']).default('STRUCTURED_ONLY'),
}).strict(); // strict() rejects undeclared properties at root and citizenContext, complementing authentication, authorization, semantic validation, and trust-boundary enforcement.
