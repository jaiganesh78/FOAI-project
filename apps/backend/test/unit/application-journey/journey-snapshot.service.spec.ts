import { describe, it, expect } from 'vitest';
import { JourneySnapshotService } from '../../../src/modules/application-journey/services/journey-snapshot.service';

describe('JourneySnapshotService', () => {
  const mockRepo = {
    createSnapshot: async (data: any) => ({ id: 'snap-1', ...data }),
  };

  const service = new JourneySnapshotService(mockRepo as any);

  it('should compute SHA-256 checksum when creating snapshot', async () => {
    const snapshot = await service.createSnapshot({
      journeyId: 'j-1',
      userId: 'u-1',
      citizenSnapshotId: 'cs-1',
      eligibilitySnapshotId: 'es-1',
      recommendationSnapshotId: 'rs-1',
      journeyVersion: 1,
      snapshotData: { key: 'value' },
    });

    const data = snapshot.snapshotData as Record<string, unknown>;
    expect(data.checksum).toBeDefined();
  });
});
