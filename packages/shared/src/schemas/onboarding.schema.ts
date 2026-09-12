import { z } from 'zod';
import { AnswerStatus } from '../enums/onboarding.enum';

export const submitAnswerSchema = z.object({
  questionKey: z.string().min(1, { message: 'Question key is required' }),
  rawInput: z.any({ required_error: 'Raw answer input is required' }),
  status: z.nativeEnum(AnswerStatus).optional().default(AnswerStatus.SUBMITTED),
});

export const updateSessionStepSchema = z.object({
  stepKey: z.string().min(1, { message: 'Step key is required' }),
  action: z.enum(['NAVIGATE', 'PAUSE', 'RESUME', 'SKIP']).optional().default('NAVIGATE'),
});

export const createSessionInputSchema = z.object({
  blueprintCode: z.string().optional().default('DEFAULT_CITIZEN'),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type UpdateSessionStepInput = z.infer<typeof updateSessionStepSchema>;
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;
