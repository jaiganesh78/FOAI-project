import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { CitizenSnapshotService } from '../../../src/modules/citizen/services/citizen-snapshot.service';
import { IProfileVersionRepository } from '../../../src/modules/citizen/repositories/profile-version.repository.interface';
import { IClockProvider } from '../../../src/core/clock/clock.provider.interface';

describe('CitizenSnapshotService (Unit Tests)', () => {
  let snapshotService: CitizenSnapshotService;
  let createdSnapshots: any[] = [];

  beforeAll(() => {
    createdSnapshots = [];
    const mockVersionRepo: IProfileVersionRepository = {
      createVersionSnapshot: async (profileId, versionNumber, snapshot, changeSummary) => {
        const item = { id: 'ver-1', profileId, versionNumber, snapshot, changeSummary };
        createdSnapshots.push(item);
        return item as any;
      },
      findLatestByProfileId: async () => null,
      findByVersionNumber: async () => null,
    };

    const mockClock: IClockProvider = {
      now: () => new Date('2026-08-06T00:00:00.000Z'),
      isoString: () => '2026-08-06T00:00:00.000Z',
      timestampMs: () => 1785974400000,
    };

    snapshotService = new CitizenSnapshotService(mockVersionRepo, mockClock);
  });

  it('should generate serialized profile snapshot payload', async () => {
    const activeFacts: any[] = [
      {
        attributeKey: 'fullName',
        valueText: 'John Doe',
        confidence: 1.0,
        verificationStatus: 'SELF_DECLARED',
        attribute: { displayName: 'Full Name', category: 'PERSONAL', dataType: 'TEXT' },
      },
    ];

    const snapshot = await snapshotService.generateSnapshot(
      'profile-123',
      'user-456',
      2,
      'IN_PROGRESS',
      25.0,
      activeFacts,
      'Added full name',
    );

    expect(snapshot.profileId).toBe('profile-123');
    expect(snapshot.versionNumber).toBe(2);
    expect(snapshot.facts).toHaveLength(1);
    expect(snapshot.facts[0].attributeKey).toBe('fullName');
    expect(createdSnapshots).toHaveLength(1);
  });
});
