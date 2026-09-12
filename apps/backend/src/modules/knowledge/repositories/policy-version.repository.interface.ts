import { PolicyVersion } from '@prisma/client';

export interface CreatePolicyVersionData {
  documentId: string;
  versionNumber: number;
  fingerprintHash: string;
  rawContentUrl?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface IPolicyVersionRepository {
  findById(id: string): Promise<PolicyVersion | null>;
  findByFingerprint(hash: string): Promise<PolicyVersion | null>;
  findByDocumentId(documentId: string): Promise<PolicyVersion[]>;
  findLatestByDocumentId(documentId: string): Promise<PolicyVersion | null>;
  createVersion(data: CreatePolicyVersionData): Promise<PolicyVersion>;
  markSuperseded(versionId: string, supersededByVersionId: string): Promise<void>;
}
