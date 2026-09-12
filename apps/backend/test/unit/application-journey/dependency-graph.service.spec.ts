import { describe, it, expect } from 'vitest';
import { JourneyDependencyGraphService } from '../../../src/modules/application-journey/services/journey-dependency-graph.service';
import { JourneyStepStatus } from '@gpios/shared';

describe('JourneyDependencyGraphService', () => {
  const service = new JourneyDependencyGraphService();

  it('should topologically sort steps based on prerequisite dependencies', () => {
    const steps = [
      { id: 's2', stepCode: 'STEP_2', prerequisiteStepIds: ['s1'], order: 2 } as any,
      { id: 's1', stepCode: 'STEP_1', prerequisiteStepIds: [], order: 1 } as any,
    ];

    const sorted = service.topologicalSort(steps);

    expect(sorted[0].id).toBe('s1');
    expect(sorted[1].id).toBe('s2');
  });

  it('should mark step as BLOCKED if prerequisite step is not completed', () => {
    const steps = [
      { id: 's1', status: JourneyStepStatus.IN_PROGRESS, prerequisiteStepIds: [] } as any,
      { id: 's2', status: JourneyStepStatus.NOT_STARTED, prerequisiteStepIds: ['s1'] } as any,
    ];

    const evaluated = service.evaluateStepStatuses(steps);

    expect(evaluated[1].status).toBe(JourneyStepStatus.BLOCKED);
  });
});
