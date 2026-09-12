import { Injectable } from '@nestjs/common';
import { OnboardingProgressDto, OnboardingSessionStatus } from '@gpios/shared';
import { DiscoveryContext } from './discovery-context.object';

export interface IProgressCalculationStrategy {
  calculateProgress(context: DiscoveryContext, totalStepsCount: number): OnboardingProgressDto;
}

@Injectable()
export class DefaultProgressCalculationStrategy implements IProgressCalculationStrategy {
  calculateProgress(context: DiscoveryContext, totalStepsCount: number): OnboardingProgressDto {
    const session = context.session;
    const completedSteps = (session.completedSteps as string[]) || [];

    const completedStepsCount = completedSteps.length;
    const completionPercentage =
      totalStepsCount > 0 ? Number(((completedStepsCount / totalStepsCount) * 100).toFixed(2)) : 100.0;

    return {
      sessionId: session.id,
      blueprintCode: session.blueprintId,
      currentStep: session.currentStep,
      totalSteps: totalStepsCount,
      completedStepsCount,
      completionPercentage,
      status: session.status as OnboardingSessionStatus,
      categoryProgress: [], // Extensible category breakdown
    };
  }
}
