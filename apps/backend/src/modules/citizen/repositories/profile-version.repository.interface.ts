import { CitizenProfileVersion } from '@prisma/client';

export interface IProfileVersionRepository {
  createVersionSnapshot(
    profileId: string,
    versionNumber: number,
    snapshot: unknown,
    changeSummary?: string,
  ): Promise<CitizenProfileVersion>;
  findLatestByProfileId(profileId: string): Promise<CitizenProfileVersion | null>;
  findByVersionNumber(profileId: string, versionNumber: number): Promise<CitizenProfileVersion | null>;
}
