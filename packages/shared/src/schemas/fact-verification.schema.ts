import { z } from 'zod';

export const VerifyFactRequestSchema = z.object({
  factId: z.string().uuid(),
  idempotencyKey: z.string().min(8),
});

export const ResolveConflictSchema = z.object({
  strategy: z.enum([
    'ACCEPT_GOVERNMENT',
    'ACCEPT_OFFICER',
    'ACCEPT_DOCUMENT',
    'ACCEPT_SYSTEM',
    'ACCEPT_CITIZEN',
    'MERGE',
    'REQUIRE_MANUAL_REVIEW',
    'DEFER',
  ]),
  winningSource: z.string().min(1),
  winningValue: z.unknown().optional(),
  overrideReason: z.string().min(5),
  idempotencyKey: z.string().min(8),
});

export const AssignReviewSchema = z.object({
  officerId: z.string().uuid(),
  idempotencyKey: z.string().min(8),
});

export const CompleteReviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().min(5),
  overrideValue: z.unknown().optional(),
  idempotencyKey: z.string().min(8),
});
