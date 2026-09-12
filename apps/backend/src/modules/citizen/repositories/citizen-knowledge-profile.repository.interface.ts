import { CitizenFact, CitizenFactVersion, FactProvenance, ProfileSnapshot, FactFreshnessPolicy } from '@prisma/client';

export type CitizenFactWithVersionsAndProvenance = CitizenFact & {
  factVersions: CitizenFactVersion[];
  provenances: FactProvenance[];
};

export interface ICitizenKnowledgeProfileRepository {
  findProfileFacts(userId: string): Promise<CitizenFactWithVersionsAndProvenance[]>;
  findFactByKey(userId: string, attributeKey: string): Promise<CitizenFactWithVersionsAndProvenance | null>;
  saveFact(userId: string, data: {
    attributeKey: string;
    value: unknown;
    normalizedValue?: unknown;
    source: string;
    sourcePrecedence: number;
    confidence: number;
    verificationStatus: string;
    evidenceId?: string;
    freshnessStatus: string;
    freshnessExpiryDate?: Date;
    freshnessPolicyVersion: number;
    expectedVersion?: number;
  }): Promise<CitizenFact>;

  createFactVersion(factId: string, data: {
    version: number;
    previousValue: unknown;
    newValue: unknown;
    source: string;
    sourcePrecedence: number;
    provenance?: unknown;
    verificationStatus: string;
    freshnessPolicyVersion: number;
    effectiveFrom: Date;
    effectiveTo?: Date;
    changeReason?: string;
    changedBy: string;
    correlationId?: string;
  }): Promise<CitizenFactVersion>;

  createFactProvenance(factId: string, data: {
    sourceType: string;
    sourceReferenceId?: string;
    documentId?: string;
    evidenceId?: string;
    actorId?: string;
    verificationMethod?: string;
    metadata?: unknown;
  }): Promise<FactProvenance>;

  getFreshnessPolicy(attributeKey: string): Promise<FactFreshnessPolicy | null>;
  createProfileSnapshot(profileId: string, data: {
    versionNumber: number;
    facts: unknown;
    factVersions: unknown;
    sourcePrecedencePolicyVersion: number;
    freshnessPolicyVersions: unknown;
    completenessConfigurationVersion: number;
    questionCatalogVersion: number;
    prioritizationConfigurationVersion: number;
    checksumSha256: string;
  }): Promise<ProfileSnapshot>;

  getProfileSnapshot(profileId: string, versionNumber: number): Promise<ProfileSnapshot | null>;
  getFactVersionsHistory(factId: string): Promise<CitizenFactVersion[]>;
}
