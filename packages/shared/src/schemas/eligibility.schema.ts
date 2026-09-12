import { z } from 'zod';

export const evaluateEligibilitySchema = z.object({
  userId: z.string().uuid({ message: 'Valid User ID UUID is required' }).optional(),
  forceRefresh: z.boolean().optional().default(false),
});

export const reEvaluateEligibilitySchema = z.object({
  attributeKeysChanged: z.array(z.string()).min(1, { message: 'At least one attribute key is required' }),
});

export type EvaluateEligibilityInput = z.infer<typeof evaluateEligibilitySchema>;
export type ReEvaluateEligibilityInput = z.infer<typeof reEvaluateEligibilitySchema>;
