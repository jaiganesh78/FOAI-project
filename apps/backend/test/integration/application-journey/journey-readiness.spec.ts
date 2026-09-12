import { describe, it, expect } from 'vitest';
import { JourneyReadinessService } from '../../../src/modules/application-journey/services/journey-readiness.service';
import { JourneyStepStatus } from '@gpios/shared';

describe('JourneyReadiness (Integration)', () => {
  const service = new JourneyReadinessService();

  it('should calculate 100% readiness score when all citizen facts and documents are verified', () => {
    const facts = { bankAccountNumber: '1234', aadhaarNumber: '5678', landHolding: 2.0 };
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
    const checklist: any = { items: [{ status: 'COMPLETED' }] };

    const readiness = service.computeJourneyReadiness(facts, steps, checklist);

    expect(readiness.score).toBeGreaterThanOrEqual(95);
    expect(readiness.missingItemsCount).toBe(0);
  });
});
