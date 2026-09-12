import { z } from 'zod';
import {
  DocumentType,
  DocumentSource,
  VerificationMethod,
  ConflictResolutionType,
} from '../enums/document.enum';

export const documentUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  documentType: z.nativeEnum(DocumentType),
  source: z.nativeEnum(DocumentSource).default(DocumentSource.CITIZEN_UPLOAD),
});

export const documentVerifySchema = z.object({
  method: z.nativeEnum(VerificationMethod),
  notes: z.string().optional(),
});

export const conflictResolveSchema = z.object({
  conflictId: z.string().uuid('Invalid Conflict ID'),
  resolutionType: z.nativeEnum(ConflictResolutionType),
  overrideValue: z.unknown().optional(),
  notes: z.string().optional(),
});

export const documentFilterSchema = z.object({
  documentType: z.nativeEnum(DocumentType).optional(),
  status: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});
