import { Inject, Injectable } from '@nestjs/common';
import { JOURNEY_SNAPSHOT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IJourneySnapshotRepository } from '../repositories/journey-snapshot.repository.interface';
import { createHash } from 'crypto';

@Injectable()
export class JourneySnapshotService {
  constructor(
    @Inject(JOURNEY_SNAPSHOT_REPOSITORY) private readonly snapshotRepo: IJourneySnapshotRepository,
  ) {}

  async createSnapshot(params: {
    journeyId: string;
    userId: string;
    citizenSnapshotId: string;
    eligibilitySnapshotId: string;
    recommendationSnapshotId: string;
    journeyVersion: number;
    snapshotData: Record<string, unknown>;
  }) {
    const rawDataStr = JSON.stringify(params.snapshotData);
    const checksum = createHash('sha256').update(rawDataStr).digest('hex');

    return this.snapshotRepo.createSnapshot({
      ...params,
      snapshotData: {
        ...params.snapshotData,
        checksum,
      },
    });
  }

  async getSnapshotById(id: string) {
    return this.snapshotRepo.findById(id);
  }

  async getSnapshotsByJourneyId(journeyId: string) {
    return this.snapshotRepo.findByJourneyId(journeyId);
  }
}
