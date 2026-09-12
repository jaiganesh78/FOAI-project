import { z } from 'zod';
import { ConfidenceSource, CreationMethod, VerificationStatus } from '../enums/citizen-provenance.enum';

export const createCitizenFactSchema = z.object({
  attributeKey: z.string().min(1, { message: 'Attribute key is required' }),
  value: z.any({ required_error: 'Fact value is required' }),
  confidence: z.number().min(0.0).max(1.0).optional().default(1.0),
  confidenceSource: z.nativeEnum(ConfidenceSource).optional().default(ConfidenceSource.USER),
  verificationStatus: z.nativeEnum(VerificationStatus).optional().default(VerificationStatus.SELF_DECLARED),
  creationMethod: z.nativeEnum(CreationMethod).optional().default(CreationMethod.USER_FORM),
  evidenceId: z.string().uuid().optional(),
});

export const updateCitizenFactSchema = z.object({
  value: z.any({ required_error: 'Updated fact value is required' }),
  changeReason: z.string().optional(),
  confidence: z.number().min(0.0).max(1.0).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
});

export type CreateCitizenFactInput = z.infer<typeof createCitizenFactSchema>;
export type UpdateCitizenFactInput = z.infer<typeof updateCitizenFactSchema>;
