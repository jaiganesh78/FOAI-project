import { describe, it, expect } from 'vitest';
import { JourneySnapshotService } from '../../../src/modules/application-journey/services/journey-snapshot.service';

describe('JourneySnapshot (Integration)', () => {
  const mockRepo = {
    createSnapshot: async (data: any) => ({ id: 'snap-101', ...data }),
  };

  const service = new JourneySnapshotService(mockRepo as any);

  it('should compute SHA-256 checksum and persist immutable snapshot data', async () => {
    const snapshot = await service.createSnapshot({
      journeyId: 'j-101',
      userId: 'user-101',
      citizenSnapshotId: 'csnap-101',
      eligibilitySnapshotId: 'esnap-101',
      recommendationSnapshotId: 'rsnap-101',
      journeyVersion: 1,
      snapshotData: { stepsCount: 4, readinessScore: 90 },
    });

    const data = snapshot.snapshotData as Record<string, unknown>;
    expect(data.checksum).toBeDefined();
    expect(snapshot.journeyId).toBe('j-101');
  });
});
