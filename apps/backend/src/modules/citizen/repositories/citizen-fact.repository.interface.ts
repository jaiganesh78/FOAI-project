import { CitizenFact, ConfidenceSource, CreationMethod, VerificationStatus } from '@prisma/client';

export interface CreateFactData {
  profileId: string;
  attributeKey: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: Date | null;
  valueJson?: unknown;
  confidence?: number;
  confidenceSource?: ConfidenceSource;
  confidenceStrategy?: string;
  verificationStatus?: VerificationStatus;
  creationMethod?: CreationMethod;
  createdBy: string;
  evidenceId?: string;
}

export interface UpdateFactData {
  valueText?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: Date | null;
  valueJson?: unknown;
  confidence?: number;
  verificationStatus?: VerificationStatus;
  changeReason?: string;
  changedBy: string;
}

export interface CitizenFactWithAttribute extends CitizenFact {
  attribute: {
    key: string;
    displayName: string;
    category: string;
    dataType: string;
  };
}

export interface ICitizenFactRepository {
  findActiveByProfileId(profileId: string): Promise<CitizenFactWithAttribute[]>;
  findByProfileAndKey(profileId: string, attributeKey: string): Promise<CitizenFactWithAttribute | null>;
  findById(id: string): Promise<CitizenFactWithAttribute | null>;
  upsertFact(data: CreateFactData): Promise<CitizenFact>;
  updateFact(factId: string, data: UpdateFactData): Promise<CitizenFact>;
  softDeleteFact(factId: string): Promise<boolean>;
}
