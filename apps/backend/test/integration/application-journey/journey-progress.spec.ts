import { describe, it, expect } from 'vitest';
import { JourneyProgressService } from '../../../src/modules/application-journey/services/journey-progress.service';

describe('JourneyProgress (Integration)', () => {
  const service = new JourneyProgressService();

  it('should track multi-dimensional progress metrics', () => {
    const steps = [
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
      { status: 'NOT_STARTED' },
      { status: 'NOT_STARTED' },
    ];

    const progress = service.calculateProgress(steps as any);

    expect(progress.overallPercentage).toBe(50);
    expect(progress.completedStepsCount).toBe(2);
  });
});
