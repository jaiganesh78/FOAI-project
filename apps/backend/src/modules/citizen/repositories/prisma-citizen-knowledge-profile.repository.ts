import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ICitizenKnowledgeProfileRepository,
  CitizenFactWithVersionsAndProvenance,
} from './citizen-knowledge-profile.repository.interface';
import { CitizenFact, CitizenFactVersion, FactProvenance, ProfileSnapshot, FactFreshnessPolicy, Prisma } from '@prisma/client';

@Injectable()
export class PrismaCitizenKnowledgeProfileRepository implements ICitizenKnowledgeProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileFacts(userId: string): Promise<CitizenFactWithVersionsAndProvenance[]> {
    const profile = await this.prisma.citizenProfile.findUnique({
      where: { userId },
    });
    if (!profile) return [];

    return this.prisma.citizenFact.findMany({
      where: { profileId: profile.id, isCurrent: true },
      include: {
        factVersions: { orderBy: { version: 'desc' } },
        provenances: { orderBy: { createdAt: 'desc' } },
      },
    }) as unknown as CitizenFactWithVersionsAndProvenance[];
  }

  async findFactByKey(userId: string, attributeKey: string): Promise<CitizenFactWithVersionsAndProvenance | null> {
    const profile = await this.prisma.citizenProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;

    return this.prisma.citizenFact.findUnique({
      where: { profileId_attributeKey: { profileId: profile.id, attributeKey } },
      include: {
        factVersions: { orderBy: { version: 'desc' } },
        provenances: { orderBy: { createdAt: 'desc' } },
      },
    }) as unknown as CitizenFactWithVersionsAndProvenance | null;
  }

  async saveFact(userId: string, data: {
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
  }): Promise<CitizenFact> {
    let profile = await this.prisma.citizenProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await this.prisma.citizenProfile.create({ data: { userId } });
    }

    const existingFact = await this.prisma.citizenFact.findUnique({
      where: { profileId_attributeKey: { profileId: profile.id, attributeKey: data.attributeKey } },
    });

    if (existingFact && data.expectedVersion !== undefined && existingFact.version !== data.expectedVersion) {
      throw new ConflictException(
        `Optimistic concurrency conflict for fact '${data.attributeKey}'. Expected version ${data.expectedVersion}, but current version is ${existingFact.version}.`,
      );
    }

    const nextVersion = existingFact ? existingFact.version + 1 : 1;

    let valueText: string | null = null;
    let valueNumber: number | null = null;
    let valueBoolean: boolean | null = null;
    let valueDate: Date | null = null;
    let valueJson: Prisma.InputJsonValue = undefined as any;

    if (typeof data.value === 'string') valueText = data.value;
    else if (typeof data.value === 'number') valueNumber = data.value;
    else if (typeof data.value === 'boolean') valueBoolean = data.value;
    else if (data.value instanceof Date) valueDate = data.value;
    else if (typeof data.value === 'object' && data.value !== null) valueJson = data.value as Prisma.InputJsonValue;

    return this.prisma.citizenFact.upsert({
      where: { profileId_attributeKey: { profileId: profile.id, attributeKey: data.attributeKey } },
      update: {
        valueText,
        valueNumber,
        valueBoolean,
        valueDate,
        valueJson,
        normalizedValue: (data.normalizedValue as Prisma.InputJsonValue) || undefined,
        source: data.source,
        sourcePrecedence: data.sourcePrecedence,
        confidence: data.confidence,
        verificationStatus: data.verificationStatus as any,
        evidenceId: data.evidenceId,
        freshnessStatus: data.freshnessStatus,
        freshnessExpiryDate: data.freshnessExpiryDate,
        freshnessPolicyVersion: data.freshnessPolicyVersion,
        version: nextVersion,
        isCurrent: true,
      },
      create: {
        profileId: profile.id,
        attributeKey: data.attributeKey,
        valueText,
        valueNumber,
        valueBoolean,
        valueDate,
        valueJson,
        normalizedValue: (data.normalizedValue as Prisma.InputJsonValue) || undefined,
        source: data.source,
        sourcePrecedence: data.sourcePrecedence,
        confidence: data.confidence,
        verificationStatus: data.verificationStatus as any,
        evidenceId: data.evidenceId,
        freshnessStatus: data.freshnessStatus,
        freshnessExpiryDate: data.freshnessExpiryDate,
        freshnessPolicyVersion: data.freshnessPolicyVersion,
        version: 1,
        createdBy: userId,
      },
    });
  }

  async createFactVersion(factId: string, data: {
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
  }): Promise<CitizenFactVersion> {
    return this.prisma.citizenFactVersion.create({
      data: {
        factId,
        version: data.version,
        previousValue: (data.previousValue as Prisma.InputJsonValue) || undefined,
        newValue: (data.newValue as Prisma.InputJsonValue) || undefined,
        source: data.source,
        sourcePrecedence: data.sourcePrecedence,
        provenance: (data.provenance as Prisma.InputJsonValue) || undefined,
        verificationStatus: data.verificationStatus,
        freshnessPolicyVersion: data.freshnessPolicyVersion,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        changeReason: data.changeReason,
        changedBy: data.changedBy,
        correlationId: data.correlationId,
      },
    });
  }

  async createFactProvenance(factId: string, data: {
    sourceType: string;
    sourceReferenceId?: string;
    documentId?: string;
    evidenceId?: string;
    actorId?: string;
    verificationMethod?: string;
    metadata?: unknown;
  }): Promise<FactProvenance> {
    return this.prisma.factProvenance.create({
      data: {
        factId,
        sourceType: data.sourceType,
        sourceReferenceId: data.sourceReferenceId,
        documentId: data.documentId,
        evidenceId: data.evidenceId,
        actorId: data.actorId,
        verificationMethod: data.verificationMethod,
        metadata: (data.metadata as Prisma.InputJsonValue) || undefined,
      },
    });
  }

  async getFreshnessPolicy(attributeKey: string): Promise<FactFreshnessPolicy | null> {
    return this.prisma.factFreshnessPolicy.findFirst({
      where: { attributeKey, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  async createProfileSnapshot(profileId: string, data: {
    versionNumber: number;
    facts: unknown;
    factVersions: unknown;
    sourcePrecedencePolicyVersion: number;
    freshnessPolicyVersions: unknown;
    completenessConfigurationVersion: number;
    questionCatalogVersion: number;
    prioritizationConfigurationVersion: number;
    checksumSha256: string;
  }): Promise<ProfileSnapshot> {
    return this.prisma.profileSnapshot.create({
      data: {
        profileId,
        versionNumber: data.versionNumber,
        facts: data.facts as Prisma.InputJsonValue,
        factVersions: data.factVersions as Prisma.InputJsonValue,
        sourcePrecedencePolicyVersion: data.sourcePrecedencePolicyVersion,
        freshnessPolicyVersions: data.freshnessPolicyVersions as Prisma.InputJsonValue,
        completenessConfigurationVersion: data.completenessConfigurationVersion,
        questionCatalogVersion: data.questionCatalogVersion,
        prioritizationConfigurationVersion: data.prioritizationConfigurationVersion,
        checksumSha256: data.checksumSha256,
      },
    });
  }

  async getProfileSnapshot(profileId: string, versionNumber: number): Promise<ProfileSnapshot | null> {
    return this.prisma.profileSnapshot.findFirst({
      where: { profileId, versionNumber },
    });
  }

  async getFactVersionsHistory(factId: string): Promise<CitizenFactVersion[]> {
    return this.prisma.citizenFactVersion.findMany({
      where: { factId },
      orderBy: { version: 'asc' },
    });
  }
}
