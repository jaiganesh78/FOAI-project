import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ICitizenAttributeRegistryRepository } from './citizen-attribute-registry.repository.interface';
import { CitizenAttributeRegistry, FactCategory } from '@prisma/client';

@Injectable()
export class PrismaCitizenAttributeRegistryRepository implements ICitizenAttributeRegistryRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByKey(key: string): Promise<CitizenAttributeRegistry | null> {
    return this.prisma.citizenAttributeRegistry.findFirst({
      where: { key, isActive: true },
    });
  }

  async findAllActive(): Promise<CitizenAttributeRegistry[]> {
    return this.prisma.citizenAttributeRegistry.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByCategory(category: string): Promise<CitizenAttributeRegistry[]> {
    return this.prisma.citizenAttributeRegistry.findMany({
      where: { category: category as FactCategory, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
