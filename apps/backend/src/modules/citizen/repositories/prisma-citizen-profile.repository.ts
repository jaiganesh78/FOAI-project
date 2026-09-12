import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ICitizenProfileRepository, CitizenProfileWithFacts } from './citizen-profile.repository.interface';
import { CitizenProfile, ProfileStatus } from '@prisma/client';

@Injectable()
export class PrismaCitizenProfileRepository implements ICitizenProfileRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CitizenProfileWithFacts | null> {
    return (await this.prisma.citizenProfile.findFirst({
      where: { userId, deletedAt: null },
      include: {
        facts: {
          where: { isCurrent: true, deletedAt: null },
          include: {
            attribute: true,
          },
        },
      },
    })) as CitizenProfileWithFacts | null;
  }

  async findById(id: string): Promise<CitizenProfileWithFacts | null> {
    return (await this.prisma.citizenProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        facts: {
          where: { isCurrent: true, deletedAt: null },
          include: {
            attribute: true,
          },
        },
      },
    })) as CitizenProfileWithFacts | null;
  }

  async createProfile(userId: string): Promise<CitizenProfile> {
    return this.prisma.citizenProfile.create({
      data: {
        userId,
        status: ProfileStatus.CREATED,
        completionPercentage: 0.0,
      },
    });
  }

  async updateStatusAndCompleteness(
    profileId: string,
    status: ProfileStatus,
    completionPercentage: number,
  ): Promise<CitizenProfile> {
    return this.prisma.citizenProfile.update({
      where: { id: profileId },
      data: {
        status,
        completionPercentage,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(profileId: string): Promise<boolean> {
    await this.prisma.citizenProfile.update({
      where: { id: profileId },
      data: { deletedAt: new Date() },
    });
    return true;
  }
}
