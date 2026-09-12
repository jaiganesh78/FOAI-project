import { Injectable } from '@nestjs/common';
import { ActionPlanDto, ApplicationJourneyStepDto, JourneyUrgency } from '@gpios/shared';

@Injectable()
export class ActionPlanningService {
  generatePersonalizedActionPlan(
    journeyId: string,
    steps: ApplicationJourneyStepDto[],
  ): ActionPlanDto {
    const actionPlanSteps = steps.map((step, idx) => {
      let timeframe: 'TODAY' | 'TOMORROW' | 'NEXT_UP' | 'FINALLY' = 'TODAY';
      if (idx === 1) timeframe = 'TOMORROW';
      else if (idx === 2) timeframe = 'NEXT_UP';
      else if (idx >= 3) timeframe = 'FINALLY';

      return {
        id: `act-step-${step.id}`,
        timeframe,
        stepTitle: step.title,
        instruction: `Complete ${step.title}: ${step.description}`,
        priority: step.order === 1 ? JourneyUrgency.CRITICAL : JourneyUrgency.HIGH,
        isCompleted: step.status === 'COMPLETED',
      };
    });

    return {
      id: `action-plan-${journeyId}`,
      journeyId,
      steps: actionPlanSteps,
      createdAt: new Date().toISOString(),
    };
  }
}
