import { describe, it, expect } from 'vitest';
import { JourneyBlueprintService } from '../../../src/modules/application-journey/services/journey-blueprint.service';

describe('JourneyBlueprintService', () => {
  const mockBlueprintRepo = {
    findById: async (id: string) => {
      if (id === 'bp-pm-kisan-v1') {
        return {
          id: 'bp-pm-kisan-v1',
          parentBlueprintId: 'bp-domain-farmer',
          policyId: 'pol-pm-kisan',
          policyTitle: 'PM Kisan',
          name: 'PM Kisan Blueprint',
          version: 1,
        };
      }
      if (id === 'bp-domain-farmer') {
        return {
          id: 'bp-domain-farmer',
          parentBlueprintId: 'bp-root-benefit-app',
          policyId: 'pol-farmer-domain',
          policyTitle: 'Farmer Domain',
          name: 'Farmer Domain Template',
          version: 1,
        };
      }
      if (id === 'bp-root-benefit-app') {
        return {
          id: 'bp-root-benefit-app',
          parentBlueprintId: null,
          policyId: 'pol-root',
          policyTitle: 'Root Benefit',
          name: 'Root Benefit Template',
          version: 1,
        };
      }
      return null;
    },
  };

  const service = new JourneyBlueprintService(mockBlueprintRepo as any);

  it('should resolve inherited steps across hierarchy (Root -> Farmer Domain -> PM-KISAN)', async () => {
    const steps = await service.resolveInheritedSteps('bp-pm-kisan-v1');

    expect(steps.length).toBe(4);
    expect(steps.map((s) => s.stepCode)).toEqual([
      'VERIFY_AADHAAR',
      'VERIFY_BANK',
      'COLLECT_LAND_RECORD',
      'SUBMIT_APPLICATION',
    ]);
  });
});
