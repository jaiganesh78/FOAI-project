import { z } from 'zod';

export const createJourneySchema = z.object({
  policyId: z.string().uuid(),
  blueprintId: z.string().uuid().optional(),
});

export const completeJourneyStepSchema = z.object({
  stepId: z.string().uuid(),
  notes: z.string().optional(),
});

export type CreateJourneyInput = z.infer<typeof createJourneySchema>;
export type CompleteJourneyStepInput = z.infer<typeof completeJourneyStepSchema>;
