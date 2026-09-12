import { describe, it, expect } from 'vitest';
import { JourneyProgressService } from '../../../src/modules/application-journey/services/journey-progress.service';

describe('JourneyProgressService', () => {
  const service = new JourneyProgressService();

  it('should calculate completion percentage accurately', () => {
    const steps = [
      { status: 'COMPLETED' },
      { status: 'NOT_STARTED' },
    ];

    const progress = service.calculateProgress(steps as any);
    expect(progress.overallPercentage).toBe(50);
  });
});
