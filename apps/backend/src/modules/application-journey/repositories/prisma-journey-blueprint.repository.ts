import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IJourneyBlueprintRepository,
  JourneyBlueprintWithVersions,
} from './journey-blueprint.repository.interface';

@Injectable()
export class PrismaJourneyBlueprintRepository implements IJourneyBlueprintRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<JourneyBlueprintWithVersions | null> {
    return this.prisma.journeyBlueprint.findUnique({
      where: { id },
      include: { versions: true, parentBlueprint: true },
    }) as Promise<JourneyBlueprintWithVersions | null>;
  }

  async findByPolicyId(policyId: string): Promise<JourneyBlueprintWithVersions | null> {
    return this.prisma.journeyBlueprint.findFirst({
      where: { policyId },
      include: { versions: true, parentBlueprint: true },
      orderBy: { version: 'desc' },
    }) as Promise<JourneyBlueprintWithVersions | null>;
  }

  async createBlueprint(data: {
    id?: string;
    parentBlueprintId?: string;
    policyId: string;
    policyTitle: string;
    name: string;
    description: string;
    version?: number;
  }): Promise<JourneyBlueprintWithVersions> {
    return this.prisma.journeyBlueprint.create({
      data: {
        id: data.id,
        parentBlueprintId: data.parentBlueprintId,
        policyId: data.policyId,
        policyTitle: data.policyTitle,
        name: data.name,
        description: data.description,
        version: data.version ?? 1,
      },
      include: { versions: true, parentBlueprint: true },
    }) as Promise<JourneyBlueprintWithVersions>;
  }
}
