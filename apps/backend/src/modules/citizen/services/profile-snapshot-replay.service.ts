import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ICitizenKnowledgeProfileRepository } from '../repositories/citizen-knowledge-profile.repository.interface';
import { ProfileSnapshotDto } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class ProfileSnapshotReplayService {
  constructor(
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY) private readonly repo: ICitizenKnowledgeProfileRepository,
  ) {}

  computeSnapshotChecksum(snapshotData: Record<string, unknown>): string {
    return createHash('sha256').update(JSON.stringify(snapshotData)).digest('hex');
  }

  async createSnapshot(profileId: string, versionNumber: number, factsMap: Record<string, unknown>, factVersionsMap: Record<string, number>): Promise<ProfileSnapshotDto> {
    const payload = {
      profileId,
      versionNumber,
      facts: factsMap,
      factVersions: factVersionsMap,
      sourcePrecedencePolicyVersion: 1,
      freshnessPolicyVersions: { default: 1 },
      completenessConfigurationVersion: 1,
      questionCatalogVersion: 1,
      prioritizationConfigurationVersion: 1,
    };

    const checksumSha256 = this.computeSnapshotChecksum(payload);

    const snapshot = await this.repo.createProfileSnapshot(profileId, {
      versionNumber,
      facts: factsMap,
      factVersions: factVersionsMap,
      sourcePrecedencePolicyVersion: 1,
      freshnessPolicyVersions: { default: 1 },
      completenessConfigurationVersion: 1,
      questionCatalogVersion: 1,
      prioritizationConfigurationVersion: 1,
      checksumSha256,
    });

    return {
      snapshotId: snapshot.id,
      profileId: snapshot.profileId,
      versionNumber: snapshot.versionNumber,
      facts: (snapshot.facts as any) || {},
      factVersions: (snapshot.factVersions as any) || {},
      sourcePrecedencePolicyVersion: snapshot.sourcePrecedencePolicyVersion,
      freshnessPolicyVersions: (snapshot.freshnessPolicyVersions as any) || {},
      completenessConfigurationVersion: snapshot.completenessConfigurationVersion,
      questionCatalogVersion: snapshot.questionCatalogVersion,
      prioritizationConfigurationVersion: snapshot.prioritizationConfigurationVersion,
      checksumSha256: snapshot.checksumSha256,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  async replaySnapshot(profileId: string, versionNumber: number): Promise<{ isVerified: boolean; snapshot: ProfileSnapshotDto }> {
    const snapshot = await this.repo.getProfileSnapshot(profileId, versionNumber);
    if (!snapshot) {
      throw new BadRequestException(`Snapshot version ${versionNumber} for profile '${profileId}' not found.`);
    }

    const payload = {
      profileId: snapshot.profileId,
      versionNumber: snapshot.versionNumber,
      facts: snapshot.facts,
      factVersions: snapshot.factVersions,
      sourcePrecedencePolicyVersion: snapshot.sourcePrecedencePolicyVersion,
      freshnessPolicyVersions: snapshot.freshnessPolicyVersions,
      completenessConfigurationVersion: snapshot.completenessConfigurationVersion,
      questionCatalogVersion: snapshot.questionCatalogVersion,
      prioritizationConfigurationVersion: snapshot.prioritizationConfigurationVersion,
    };

    const calculatedChecksum = this.computeSnapshotChecksum(payload as any);
    if (calculatedChecksum !== snapshot.checksumSha256) {
      throw new BadRequestException(
        `LOUD REPLAY FAILURE: Profile snapshot checksum mismatch! Expected ${snapshot.checksumSha256}, calculated ${calculatedChecksum}. Snapshot integrity corrupted.`,
      );
    }

    return {
      isVerified: true,
      snapshot: {
        snapshotId: snapshot.id,
        profileId: snapshot.profileId,
        versionNumber: snapshot.versionNumber,
        facts: (snapshot.facts as any) || {},
        factVersions: (snapshot.factVersions as any) || {},
        sourcePrecedencePolicyVersion: snapshot.sourcePrecedencePolicyVersion,
        freshnessPolicyVersions: (snapshot.freshnessPolicyVersions as any) || {},
        completenessConfigurationVersion: snapshot.completenessConfigurationVersion,
        questionCatalogVersion: snapshot.questionCatalogVersion,
        prioritizationConfigurationVersion: snapshot.prioritizationConfigurationVersion,
        checksumSha256: snapshot.checksumSha256,
        createdAt: snapshot.createdAt.toISOString(),
      },
    };
  }
}
