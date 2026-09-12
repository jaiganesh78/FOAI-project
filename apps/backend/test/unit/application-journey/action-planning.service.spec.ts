import { describe, it, expect } from 'vitest';
import { ActionPlanningService } from '../../../src/modules/application-journey/services/action-planning.service';

describe('ActionPlanningService', () => {
  const service = new ActionPlanningService();

  it('should generate personalized action plan steps grouped by timeframe', () => {
    const steps = [
      { id: 's1', title: 'Verify Aadhaar', description: 'Desc', order: 1, status: 'NOT_STARTED' },
      { id: 's2', title: 'Collect Patta', description: 'Desc', order: 2, status: 'NOT_STARTED' },
    ];

    const actionPlan = service.generatePersonalizedActionPlan('j-1', steps as any);

    expect(actionPlan.steps.length).toBe(2);
    expect(actionPlan.steps[0].timeframe).toBe('TODAY');
    expect(actionPlan.steps[1].timeframe).toBe('TOMORROW');
  });
});
