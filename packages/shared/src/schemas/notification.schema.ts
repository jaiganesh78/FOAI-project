import { z } from 'zod';

export const UpdateNotificationPreferenceSchema = z.object({
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']),
  status: z.enum(['ENABLED', 'DISABLED', 'NOT_CONFIGURED']),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

export const ActionItemTransitionSchema = z.object({
  expectedVersion: z.number().int().min(1),
  reason: z.string().optional(),
});

export const CreateTemplateVersionSchema = z.object({
  templateId: z.string().min(1),
  version: z.number().int().min(1),
  locale: z.string().default('en-IN'),
  titleTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  actionUrlTemplate: z.string().optional(),
});

export const CreatePolicyVersionSchema = z.object({
  policyId: z.string().min(1),
  version: z.number().int().min(1),
  minMaterialityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  cooldownWindowSeconds: z.number().int().min(0).default(300),
  maxPerWindow: z.number().int().min(1).default(3),
  allowedChannels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH'])),
  fallbackPrecedence: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH'])),
});
