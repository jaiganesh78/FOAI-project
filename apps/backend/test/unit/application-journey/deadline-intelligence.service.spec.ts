import { describe, it, expect } from 'vitest';
import { DeadlineIntelligenceService } from '../../../src/modules/application-journey/services/deadline-intelligence.service';
import { JourneyUrgency } from '@gpios/shared';

describe('DeadlineIntelligenceService', () => {
  const service = new DeadlineIntelligenceService();

  it('should assign CRITICAL urgency for PM Kisan scheme', () => {
    const urgency = service.computeJourneyUrgency('PM Kisan Samman Nidhi', 80);
    expect(urgency).toBe(JourneyUrgency.CRITICAL);
  });
});
