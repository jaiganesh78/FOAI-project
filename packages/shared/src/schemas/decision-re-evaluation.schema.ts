import { z } from 'zod';

export const TriggerReEvaluationSchema = z.object({
  triggerType: z.string().min(1),
  triggerEntityId: z.string().uuid(),
  triggerEntityVersion: z.number().int().min(1),
  sourceEventId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const TriggerPolicyChangeSchema = z.object({
  policyId: z.string().min(1),
  version: z.number().int().min(1),
  activationReason: z.string().min(5),
  idempotencyKey: z.string().min(8),
});
