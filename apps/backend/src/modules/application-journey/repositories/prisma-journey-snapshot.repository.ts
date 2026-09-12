import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IJourneySnapshotRepository,
  CreateJourneySnapshotData,
} from './journey-snapshot.repository.interface';
import { JourneySnapshot, Prisma } from '@prisma/client';

@Injectable()
export class PrismaJourneySnapshotRepository implements IJourneySnapshotRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<JourneySnapshot | null> {
    return this.prisma.journeySnapshot.findUnique({
      where: { id },
    });
  }

  async findByJourneyId(journeyId: string): Promise<JourneySnapshot[]> {
    return this.prisma.journeySnapshot.findMany({
      where: { journeyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<JourneySnapshot[]> {
    return this.prisma.journeySnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSnapshot(data: CreateJourneySnapshotData): Promise<JourneySnapshot> {
    return this.prisma.journeySnapshot.create({
      data: {
        journeyId: data.journeyId,
        userId: data.userId,
        citizenSnapshotId: data.citizenSnapshotId,
        eligibilitySnapshotId: data.eligibilitySnapshotId,
        recommendationSnapshotId: data.recommendationSnapshotId,
        journeyVersion: data.journeyVersion,
        snapshotData: (data.snapshotData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
}
