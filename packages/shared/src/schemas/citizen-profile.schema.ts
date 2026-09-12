import { z } from 'zod';

export const SubmitAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  questionVersionId: z.string().uuid(),
  attributeKey: z.string().min(1),
  answerValue: z.unknown(),
  idempotencyKey: z.string().min(8),
});

export const StartOnboardingSchema = z.object({
  persona: z.string().optional().default('ALL'),
});

export const ResumeOnboardingSchema = z.object({
  sessionId: z.string().uuid(),
});

export const ReconcileConflictRequestSchema = z.object({
  conflictId: z.string().uuid(),
  resolutionType: z.enum(['ACCEPT_DOCUMENT', 'ACCEPT_CITIZEN_DECLARATION', 'MANUAL_OVERRIDE', 'SUPERSEDE']),
  overrideValue: z.unknown().optional(),
});
