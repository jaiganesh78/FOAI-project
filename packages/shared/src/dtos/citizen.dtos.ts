import { FactCategory } from '../enums/citizen-fact-category.enum';
import { AttributeDataType } from '../enums/citizen-data-type.enum';
import { ProfileStatus, VerificationStatus, CreationMethod, ConfidenceSource } from '../enums/citizen-provenance.enum';

export interface CitizenFactResponseDto {
  id: string;
  attributeKey: string;
  displayName: string;
  category: FactCategory;
  dataType: AttributeDataType;
  value: unknown;
  confidence: number;
  confidenceSource: ConfidenceSource;
  verificationStatus: VerificationStatus;
  creationMethod: CreationMethod;
  createdBy: string;
  evidenceId?: string | null;
  version: number;
  updatedAt: string;
}

export interface CitizenProfileResponseDto {
  id: string;
  userId: string;
  status: ProfileStatus;
  completionPercentage: number;
  version: number;
  factsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletenessResponseDto {
  profileId: string;
  completionPercentage: number;
  status: ProfileStatus;
  totalCategories: number;
  completedCategories: number;
  missingCategories: string[];
  missingMandatoryAttributes: {
    key: string;
    displayName: string;
    category: string;
  }[];
}

export interface CreateCitizenFactInputDto {
  attributeKey: string;
  value: unknown;
  confidence?: number;
  confidenceSource?: ConfidenceSource;
  verificationStatus?: VerificationStatus;
  creationMethod?: CreationMethod;
  evidenceId?: string;
}

export interface UpdateCitizenFactInputDto {
  value: unknown;
  changeReason?: string;
  confidence?: number;
  verificationStatus?: VerificationStatus;
}
