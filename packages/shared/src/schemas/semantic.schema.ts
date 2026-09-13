import { z } from 'zod';

export const resolveSemanticValueSchema = z.object({
  attributeCode: z.string().min(1, { message: 'Attribute code is required' }),
  rawValue: z.any(),
  unit: z.string().optional(),
});

export const validateSemanticValueSchema = z.object({
  attributeCode: z.string().min(1, { message: 'Attribute code is required' }),
  value: z.any(),
  unit: z.string().optional(),
});

export const convertSemanticUnitSchema = z.object({
  value: z.number({ required_error: 'Numeric value is required' }),
  fromUnit: z.string().min(1, { message: 'fromUnit is required' }),
  toUnit: z.string().min(1, { message: 'toUnit is required' }),
});

export type ResolveSemanticValueInput = z.infer<typeof resolveSemanticValueSchema>;
export type ValidateSemanticValueInput = z.infer<typeof validateSemanticValueSchema>;
export type ConvertSemanticUnitInput = z.infer<typeof convertSemanticUnitSchema>;
