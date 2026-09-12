import { describe, it, expect } from 'vitest';
import { JourneyDifferenceService } from '../../../src/modules/application-journey/services/journey-difference.service';
import { JourneyStepStatus } from '@gpios/shared';

describe('JourneyDifferenceService', () => {
  const service = new JourneyDifferenceService();

  it('should detect step status transitions between revisions', () => {
    const oldSteps: any[] = [
      {
        id: 's1',
        stepCode: 'VERIFY_AADHAAR',
        title: 'Verify Aadhaar',
        description: 'Desc',
        status: JourneyStepStatus.IN_PROGRESS,
        order: 1,
        isOptional: false,
        executionPolicy: {} as any,
        prerequisiteStepIds: [],
        blockedByStepIds: [],
      },
    ];
    const newSteps: any[] = [
      {
        id: 's1',
        stepCode: 'VERIFY_AADHAAR',
        title: 'Verify Aadhaar',
        description: 'Desc',
        status: JourneyStepStatus.COMPLETED,
        order: 1,
        isOptional: false,
        executionPolicy: {} as any,
        prerequisiteStepIds: [],
        blockedByStepIds: [],
      },
    ];

    const diffs = service.computeDifferences('j-1', oldSteps, newSteps);

    expect(diffs.length).toBe(1);
    expect(diffs[0].changeType).toBe('STEP_COMPLETED');
  });
});
