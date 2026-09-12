import { CitizenProfile, ProfileStatus } from '@prisma/client';

export interface CitizenProfileWithFacts extends CitizenProfile {
  facts: {
    id: string;
    attributeKey: string;
    valueText: string | null;
    valueNumber: number | null;
    valueBoolean: boolean | null;
    valueDate: Date | null;
    valueJson: unknown;
    confidence: number;
    confidenceSource: string;
    verificationStatus: string;
    creationMethod: string;
    createdBy: string;
    isCurrent: boolean;
    version: number;
    updatedAt: Date;
    attribute: {
      key: string;
      displayName: string;
      category: string;
      dataType: string;
      isMandatory: boolean;
    };
  }[];
}

export interface ICitizenProfileRepository {
  findByUserId(userId: string): Promise<CitizenProfileWithFacts | null>;
  findById(id: string): Promise<CitizenProfileWithFacts | null>;
  createProfile(userId: string): Promise<CitizenProfile>;
  updateStatusAndCompleteness(
    profileId: string,
    status: ProfileStatus,
    completionPercentage: number,
  ): Promise<CitizenProfile>;
  softDelete(profileId: string): Promise<boolean>;
}
