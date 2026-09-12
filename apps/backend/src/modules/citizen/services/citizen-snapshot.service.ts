import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_VERSION_REPOSITORY, CLOCK_PROVIDER } from '../../../core/tokens/injection-tokens';
import { IProfileVersionRepository } from '../repositories/profile-version.repository.interface';
import { CitizenFactWithAttribute } from '../repositories/citizen-fact.repository.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';

export interface CitizenSnapshotPayload {
  profileId: string;
  userId: string;
  versionNumber: number;
  status: string;
  completionPercentage: number;
  snapshotTimestamp: string;
  facts: {
    attributeKey: string;
    displayName: string;
    category: string;
    dataType: string;
    value: unknown;
    confidence: number;
    verificationStatus: string;
  }[];
}

@Injectable()
export class CitizenSnapshotService {
  constructor(
    @Inject(PROFILE_VERSION_REPOSITORY) private readonly profileVersionRepository: IProfileVersionRepository,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async generateSnapshot(
    profileId: string,
    userId: string,
    versionNumber: number,
    status: string,
    completionPercentage: number,
    activeFacts: CitizenFactWithAttribute[],
    changeSummary?: string,
  ): Promise<CitizenSnapshotPayload> {
    const snapshotPayload: CitizenSnapshotPayload = {
      profileId,
      userId,
      versionNumber,
      status,
      completionPercentage,
      snapshotTimestamp: this.clockProvider.now().toISOString(),
      facts: activeFacts.map((f) => ({
        attributeKey: f.attributeKey,
        displayName: f.attribute.displayName,
        category: f.attribute.category,
        dataType: f.attribute.dataType,
        value: f.valueBoolean ?? f.valueNumber ?? f.valueDate ?? f.valueText ?? f.valueJson,
        confidence: f.confidence,
        verificationStatus: f.verificationStatus,
      })),
    };

    await this.profileVersionRepository.createVersionSnapshot(
      profileId,
      versionNumber,
      snapshotPayload,
      changeSummary,
    );

    return snapshotPayload;
  }
}
