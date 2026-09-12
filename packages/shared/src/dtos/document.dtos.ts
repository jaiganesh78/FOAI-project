import {
  DocumentStatus,
  DocumentType,
  DocumentQualityGrade,
  OCRReadiness,
  EvidenceStatus,
  DocumentVerificationStatus,
  ConflictStatus,
  DocumentConfidenceLevel,
  VerificationMethod,
  DocumentSource,
  ConflictResolutionType,
} from '../enums/document.enum';

export interface DocumentClassificationDto {
  documentId: string;
  documentCategory: DocumentType;
  detectedLanguage: string;
  pageOrientation: 'PORTRAIT' | 'LANDSCAPE' | 'UNKNOWN';
  layoutType: 'SINGLE_PAGE' | 'MULTI_PAGE' | 'FORM' | 'TABULAR';
  ocrTemplateId?: string;
  isOcrRequired: boolean;
  isEncrypted: boolean;
  isSupported: boolean;
  classificationConfidence: number;
}

export interface DocumentQualityDto {
  documentId: string;
  qualityScore: number; // 0-100
  qualityGrade: DocumentQualityGrade;
  ocrReadiness: OCRReadiness;
  resolutionDpi: number;
  isBlurred: boolean;
  noiseLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contrastScore: number;
  issues: string[];
  recommendedFixes: string[];
}

export interface EvidenceTrustScoreDto {
  evidenceId: string;
  trustScore: number; // 0-100
  documentAgeDays: number;
  verificationMethodWeight: number;
  governmentSourceWeight: number;
  manualVerificationBonus: number;
  ocrQualityScore: number;
  documentQualityScore: number;
  extractionConfidence: number;
  conflictHistoryPenalty: number;
  confidenceLevel: DocumentConfidenceLevel;
}

export interface DocumentDto {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  checksumSha256: string;
  documentType: DocumentType;
  source: DocumentSource;
  status: DocumentStatus;
  classification?: DocumentClassificationDto;
  quality?: DocumentQualityDto;
  trustScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionDto {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  storageUrl: string;
  checksumSha256: string;
  createdAt: string;
}

export interface DocumentAliasDto {
  id: string;
  originalDocumentId: string;
  aliasDocumentId: string;
  checksumSha256: string;
  createdAt: string;
}

export interface OCRResultDto {
  jobId: string;
  documentId: string;
  status: string;
  totalBlocks: number;
  averageConfidence: number;
  extractedFactsCount: number;
  completedAt?: string;
}

export interface FactExtractionDto {
  id: string;
  documentId: string;
  factKey: string;
  extractedValue: unknown;
  rawText: string;
  confidence: number;
  boundingPoly?: Record<string, unknown>;
}

export interface EvidenceDto {
  id: string;
  documentId: string;
  userId: string;
  factKey: string;
  factValue: unknown;
  status: EvidenceStatus;
  trustScore: EvidenceTrustScoreDto;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceVersionDto {
  id: string;
  evidenceId: string;
  version: number;
  factKey: string;
  factValue: unknown;
  status: EvidenceStatus;
  createdAt: string;
}

export interface EvidenceGraphDto {
  factKey: string;
  evidenceId: string;
  documentId: string;
  ocrBlockId?: string;
  originalFileName: string;
  provenanceChain: string[];
}

export interface VerificationDto {
  id: string;
  documentId: string;
  userId: string;
  status: DocumentVerificationStatus;
  method: VerificationMethod;
  verifiedBy: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ConflictDto {
  id: string;
  documentId: string;
  userId: string;
  factKey: string;
  declaredValue: unknown;
  extractedValue: unknown;
  status: ConflictStatus;
  createdAt: string;
}

export interface ReconciliationDto {
  id: string;
  conflictId: string;
  documentId: string;
  userId: string;
  factKey: string;
  resolutionType: ConflictResolutionType;
  finalValue: unknown;
  reconciledBy: string;
  reconciledAt: string;
}

export interface DocumentExpiryDto {
  documentId: string;
  documentType: DocumentType;
  issueDate?: string;
  expiryDate?: string;
  daysRemaining?: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface DocumentAnalyticsDto {
  totalDocumentsUploaded: number;
  totalVerifiedDocuments: number;
  totalConflictedDocuments: number;
  averageQualityScore: number;
  averageTrustScore: number;
  averageOcrConfidence: number;
  deduplicationSavingsCount: number;
  mostUploadedDocumentType: string;
}

export interface DocumentReplayResultDto {
  documentId: string;
  snapshotId: string;
  isMatch: boolean;
  executionTimeMs: number;
}
