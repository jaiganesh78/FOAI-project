import { DocumentVerificationStatus, DocumentType } from '../enums/document.enum';

export interface DocumentUploadedEventPayload {
  documentId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksumSha256: string;
  source: string;
}

export interface DocumentClassifiedEventPayload {
  documentId: string;
  userId: string;
  documentType: DocumentType;
  detectedLanguage: string;
  ocrTemplateId?: string;
  isOcrRequired: boolean;
  classificationConfidence: number;
}

export interface DocumentQualityCheckedEventPayload {
  documentId: string;
  userId: string;
  qualityScore: number;
  qualityGrade: string;
  ocrReadiness: string;
  issuesCount: number;
}

export interface DocumentOcrCompletedEventPayload {
  documentId: string;
  userId: string;
  ocrJobId: string;
  blocksCount: number;
  ocrConfidence: number;
}

export interface DocumentFactsExtractedEventPayload {
  documentId: string;
  userId: string;
  extractedFactsCount: number;
  extractionConfidence: number;
}

export interface DocumentVerifiedEventPayload {
  documentId: string;
  userId: string;
  verificationId: string;
  status: DocumentVerificationStatus;
  verifiedBy: string;
}

export interface DocumentConflictDetectedEventPayload {
  documentId: string;
  userId: string;
  conflictId: string;
  factKey: string;
  declaredValue: unknown;
  extractedValue: unknown;
}

export interface DocumentReconciledEventPayload {
  documentId: string;
  userId: string;
  reconciliationId: string;
  conflictId: string;
  factKey: string;
  finalValue: unknown;
}

export interface EvidenceCreatedEventPayload {
  evidenceId: string;
  documentId: string;
  userId: string;
  factKey: string;
  trustScore: number;
}
