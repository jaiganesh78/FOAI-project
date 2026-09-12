import { describe, it, expect } from 'vitest';
import { JourneyConstraintEngine } from '../../../src/modules/application-journey/services/journey-constraint.engine';
import { JourneyStepStatus } from '@gpios/shared';

describe('JourneyConstraintEngine', () => {
  const engine = new JourneyConstraintEngine();

  it('should pass validation when all prerequisite steps are completed and constraints met', () => {
    const res = engine.evaluateStepCompletionConstraints({
      stepId: 'step-2',
      stepCode: 'SUBMIT_APPLICATION',
      prerequisiteStepStatuses: { 'step-1': JourneyStepStatus.COMPLETED },
      deadlinePassed: false,
      documentUploaded: true,
      verificationComplete: true,
    });

    expect(res.isValid).toBe(true);
    expect(res.violations.length).toBe(0);
  });

  it('should report violation if prerequisite step is not completed', () => {
    const res = engine.evaluateStepCompletionConstraints({
      stepId: 'step-2',
      stepCode: 'SUBMIT_APPLICATION',
      prerequisiteStepStatuses: { 'step-1': JourneyStepStatus.IN_PROGRESS },
      deadlinePassed: false,
      documentUploaded: true,
      verificationComplete: true,
    });

    expect(res.isValid).toBe(false);
    expect(res.violations[0]).toContain('Prerequisite step');
  });
});
