import { Injectable } from '@nestjs/common';
import { JourneyUrgency } from '@gpios/shared';

@Injectable()
export class DeadlineIntelligenceService {
  computeJourneyUrgency(policyTitle: string, _readinessScore: number): JourneyUrgency {
    const titleLower = policyTitle.toLowerCase();
    if (titleLower.includes('kisan') || titleLower.includes('emergency')) {
      return JourneyUrgency.CRITICAL;
    }
    if (titleLower.includes('scholarship')) {
      return JourneyUrgency.HIGH;
    }
    return JourneyUrgency.MEDIUM;
  }
}
