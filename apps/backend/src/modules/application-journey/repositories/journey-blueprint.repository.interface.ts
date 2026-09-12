import { JourneyBlueprint, JourneyBlueprintVersion } from '@prisma/client';

export type JourneyBlueprintWithVersions = JourneyBlueprint & {
  versions: JourneyBlueprintVersion[];
  parentBlueprint?: JourneyBlueprint | null;
};

export interface IJourneyBlueprintRepository {
  findById(id: string): Promise<JourneyBlueprintWithVersions | null>;
  findByPolicyId(policyId: string): Promise<JourneyBlueprintWithVersions | null>;
  createBlueprint(data: {
    id?: string;
    parentBlueprintId?: string;
    policyId: string;
    policyTitle: string;
    name: string;
    description: string;
    version?: number;
  }): Promise<JourneyBlueprintWithVersions>;
}
