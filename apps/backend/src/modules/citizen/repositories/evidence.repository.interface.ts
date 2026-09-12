import { FactEvidence, VerificationStatus } from '@prisma/client';

export interface CreateEvidenceData {
  documentType: string;
  issuingAuthority?: string;
  issueDate?: Date;
  expiryDate?: Date;
  verificationStatus?: VerificationStatus;
  storageRef?: string;
  checksum?: string;
  metadata?: unknown;
}

export interface IEvidenceRepository {
  findById(id: string): Promise<FactEvidence | null>;
  createEvidence(data: CreateEvidenceData): Promise<FactEvidence>;
}
