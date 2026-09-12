import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IDiscoveryBlueprintRepository } from './discovery-blueprint.repository.interface';
import { DiscoveryBlueprint } from '@prisma/client';

@Injectable()
export class PrismaDiscoveryBlueprintRepository implements IDiscoveryBlueprintRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByCode(code: string): Promise<DiscoveryBlueprint | null> {
    return this.prisma.discoveryBlueprint.findFirst({
      where: { code, isActive: true },
    });
  }

  async findById(id: string): Promise<DiscoveryBlueprint | null> {
    return this.prisma.discoveryBlueprint.findFirst({
      where: { id, isActive: true },
    });
  }

  async findAllActive(): Promise<DiscoveryBlueprint[]> {
    return this.prisma.discoveryBlueprint.findMany({
      where: { isActive: true },
    });
  }
}
