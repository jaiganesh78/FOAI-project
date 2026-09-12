import { describe, it, expect } from 'vitest';
import { JourneyPlannerService } from '../../../src/modules/application-journey/services/journey-planner.service';

describe('JourneyPlannerService', () => {
  const mockBlueprintService = {
    resolveInheritedSteps: async () => [
      { id: 's1', stepCode: 'STEP_1', prerequisiteStepIds: [], status: 'NOT_STARTED' },
    ],
  };

  const mockGraphService = {
    topologicalSort: (steps: any[]) => steps,
    evaluateStepStatuses: (steps: any[]) => steps.map((s) => ({ ...s, status: 'READY' })),
  };

  const service = new JourneyPlannerService(mockBlueprintService as any, mockGraphService as any);

  it('should create execution plan from blueprint steps', async () => {
    const plan = await service.createPlanForBlueprint('bp-1');
    expect(plan.length).toBe(1);
    expect(plan[0].status).toBe('READY');
  });
});
