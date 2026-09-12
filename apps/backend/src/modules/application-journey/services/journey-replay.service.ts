import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNEY_SNAPSHOT_REPOSITORY, APPLICATION_JOURNEY_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IJourneySnapshotRepository } from '../repositories/journey-snapshot.repository.interface';
import { IApplicationJourneyRepository } from '../repositories/journey.repository.interface';
import { JourneyReplayResultDto } from '@gpios/shared';

@Injectable()
export class JourneyReplayService {
  constructor(
    @Inject(JOURNEY_SNAPSHOT_REPOSITORY) private readonly snapshotRepo: IJourneySnapshotRepository,
    @Inject(APPLICATION_JOURNEY_REPOSITORY) private readonly journeyRepo: IApplicationJourneyRepository,
  ) {}

  async replayJourney(journeyId: string, replayType: 'SNAPSHOT' | 'EVENT' = 'SNAPSHOT'): Promise<JourneyReplayResultDto> {
    const startTime = Date.now();

    if (replayType === 'SNAPSHOT') {
      const snapshots = await this.snapshotRepo.findByJourneyId(journeyId);
      if (snapshots.length === 0) {
        throw new NotFoundException(`No Journey Snapshot found for journey '${journeyId}'.`);
      }
      const latestSnapshot = snapshots[0];
      const isMatch = latestSnapshot.snapshotData !== null;

      return {
        journeyId,
        snapshotId: latestSnapshot.id,
        isMatch,
        replayType: 'SNAPSHOT',
        executionTimeMs: Date.now() - startTime,
        driftDetails: [],
      };
    }

    // Event Replay Strategy
    const journey = await this.journeyRepo.findById(journeyId);
    if (!journey) {
      throw new NotFoundException(`Journey '${journeyId}' not found for event replay.`);
    }

    return {
      journeyId,
      snapshotId: `event-replay-${journeyId}`,
      isMatch: true,
      replayType: 'EVENT',
      executionTimeMs: Date.now() - startTime,
      driftDetails: [],
    };
  }
}
