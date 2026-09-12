import {
  Document,
  DocumentVersion,
  DocumentAlias,
  DocumentIntelligenceClassification,
  DocumentQuality,
  DocumentChecksum,
  DocumentExpiry,
} from '@prisma/client';
import { DocumentStatus, DocumentType, DocumentSource } from '@gpios/shared';

export type DocumentWithDetails = Document & {
  versions: DocumentVersion[];
  classification: DocumentIntelligenceClassification | null;
  quality: DocumentQuality | null;
};

export interface CreateDocumentData {
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  checksumSha256: string;
  documentType: DocumentType;
  source: DocumentSource;
}

export interface IDocumentRepository {
  createDocument(data: CreateDocumentData): Promise<DocumentWithDetails>;
  findById(id: string): Promise<DocumentWithDetails | null>;
  findByUserId(userId: string): Promise<DocumentWithDetails[]>;
  findByChecksum(checksumSha256: string): Promise<DocumentWithDetails | null>;
  updateStatus(id: string, status: DocumentStatus): Promise<DocumentWithDetails>;
  updateTrustScore(id: string, trustScore: number): Promise<void>;
  createVersion(documentId: string, version: number, data: CreateDocumentData): Promise<DocumentVersion>;
  createAlias(originalDocumentId: string, aliasDocumentId: string, checksumSha256: string): Promise<DocumentAlias>;
  saveClassification(documentId: string, data: Record<string, unknown>): Promise<DocumentIntelligenceClassification>;
  saveQuality(documentId: string, data: Record<string, unknown>): Promise<DocumentQuality>;
  saveExpiry(documentId: string, data: Record<string, unknown>): Promise<DocumentExpiry>;
  getChecksumRecord(checksumSha256: string): Promise<DocumentChecksum | null>;
}
