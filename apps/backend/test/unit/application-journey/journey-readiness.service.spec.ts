import { describe, it, expect } from 'vitest';
import { JourneyReadinessService } from '../../../src/modules/application-journey/services/journey-readiness.service';
import { JourneyStepStatus } from '@gpios/shared';

describe('JourneyReadinessService', () => {
  const service = new JourneyReadinessService();

  it('should compute readiness score based on facts, steps, and checklist', () => {
    const steps: any[] = [
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

    const readiness = service.computeJourneyReadiness(
      { bankAccountNumber: '123', aadhaarNumber: '456', landHolding: 1.5 },
      steps,
      { items: [] } as any,
    );

    expect(readiness.score).toBeGreaterThan(70);
    expect(readiness.citizenFactsPercentage).toBe(100);
  });
});
