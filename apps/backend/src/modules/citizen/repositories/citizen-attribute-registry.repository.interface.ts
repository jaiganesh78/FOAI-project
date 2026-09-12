import { CitizenAttributeRegistry } from '@prisma/client';

export interface ICitizenAttributeRegistryRepository {
  findByKey(key: string): Promise<CitizenAttributeRegistry | null>;
  findAllActive(): Promise<CitizenAttributeRegistry[]>;
  findByCategory(category: string): Promise<CitizenAttributeRegistry[]>;
}
