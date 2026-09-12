import { JourneySnapshot } from '@prisma/client';

export interface CreateJourneySnapshotData {
  journeyId: string;
  userId: string;
  citizenSnapshotId: string;
  eligibilitySnapshotId: string;
  recommendationSnapshotId: string;
  journeyVersion: number;
  snapshotData: Record<string, unknown>;
}

export interface IJourneySnapshotRepository {
  findById(id: string): Promise<JourneySnapshot | null>;
  findByJourneyId(journeyId: string): Promise<JourneySnapshot[]>;
  findByUserId(userId: string): Promise<JourneySnapshot[]>;
  createSnapshot(data: CreateJourneySnapshotData): Promise<JourneySnapshot>;
}
