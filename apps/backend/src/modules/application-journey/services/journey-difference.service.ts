import { Injectable } from '@nestjs/common';
import { JourneyDifferenceDto, ApplicationJourneyStepDto } from '@gpios/shared';

@Injectable()
export class JourneyDifferenceService {
  computeDifferences(
    journeyId: string,
    oldSteps: ApplicationJourneyStepDto[],
    newSteps: ApplicationJourneyStepDto[],
  ): JourneyDifferenceDto[] {
    const diffs: JourneyDifferenceDto[] = [];
    const oldMap = new Map<string, ApplicationJourneyStepDto>(oldSteps.map((s) => [s.id, s]));

    for (const newStep of newSteps) {
      const oldStep = oldMap.get(newStep.id);
      if (oldStep && oldStep.status !== newStep.status) {
        if (newStep.status === 'COMPLETED') {
          diffs.push({
            journeyId,
            changeType: 'STEP_COMPLETED',
            stepTitle: newStep.title,
            details: `Step '${newStep.title}' transitioned from ${oldStep.status} to COMPLETED`,
          });
        } else if (newStep.status === 'BLOCKED') {
          diffs.push({
            journeyId,
            changeType: 'STEP_BLOCKED',
            stepTitle: newStep.title,
            details: `Step '${newStep.title}' is now BLOCKED by unfulfilled prerequisites`,
          });
        }
      }
    }

    return diffs;
  }
}
