import { DiscoveryBlueprint } from '@prisma/client';

export interface IDiscoveryBlueprintRepository {
  findByCode(code: string): Promise<DiscoveryBlueprint | null>;
  findById(id: string): Promise<DiscoveryBlueprint | null>;
  findAllActive(): Promise<DiscoveryBlueprint[]>;
}
