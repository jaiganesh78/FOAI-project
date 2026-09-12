import { describe, it, expect } from 'vitest';
import { JourneyReplayService } from '../../../src/modules/application-journey/services/journey-replay.service';

describe('JourneyReplayService', () => {
  const mockSnapshotRepo = {
    findByJourneyId: async () => [{ id: 'snap-1', snapshotData: { data: 'test' } }],
  };

  const mockJourneyRepo = {
    findById: async () => ({ id: 'j-1', status: 'IN_PROGRESS' }),
  };

  const service = new JourneyReplayService(mockSnapshotRepo as any, mockJourneyRepo as any);

  it('should support SNAPSHOT replay strategy', async () => {
    const res = await service.replayJourney('j-1', 'SNAPSHOT');

    expect(res.replayType).toBe('SNAPSHOT');
    expect(res.isMatch).toBe(true);
  });

  it('should support EVENT replay strategy', async () => {
    const res = await service.replayJourney('j-1', 'EVENT');

    expect(res.replayType).toBe('EVENT');
    expect(res.isMatch).toBe(true);
  });
});
