import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IProfileVersionRepository } from './profile-version.repository.interface';
import { CitizenProfileVersion, Prisma } from '@prisma/client';

@Injectable()
export class PrismaProfileVersionRepository implements IProfileVersionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createVersionSnapshot(
    profileId: string,
    versionNumber: number,
    snapshot: unknown,
    changeSummary?: string,
  ): Promise<CitizenProfileVersion> {
    return this.prisma.citizenProfileVersion.create({
      data: {
        profileId,
        versionNumber,
        snapshot: snapshot as Prisma.InputJsonValue,
        changeSummary: changeSummary || null,
      },
    });
  }

  async findLatestByProfileId(profileId: string): Promise<CitizenProfileVersion | null> {
    return this.prisma.citizenProfileVersion.findFirst({
      where: { profileId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async findByVersionNumber(profileId: string, versionNumber: number): Promise<CitizenProfileVersion | null> {
    return this.prisma.citizenProfileVersion.findFirst({
      where: { profileId, versionNumber },
    });
  }
}
