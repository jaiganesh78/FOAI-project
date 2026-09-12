import { Injectable } from '@nestjs/common';
import { ApplicationJourneyStepDto } from '@gpios/shared';

@Injectable()
export class JourneyProgressService {
  calculateProgress(steps: ApplicationJourneyStepDto[]) {
    if (!steps || steps.length === 0) return { overallPercentage: 0 };
    const completed = steps.filter((s) => s.status === 'COMPLETED').length;
    const overallPercentage = Math.round((completed / steps.length) * 100);
    return {
      overallPercentage,
      completedStepsCount: completed,
      totalStepsCount: steps.length,
    };
  }
}
