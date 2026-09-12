import { Injectable } from '@nestjs/common';
import { JourneyReadinessDto, ApplicationJourneyStepDto, ApplicationChecklistDto } from '@gpios/shared';

@Injectable()
export class JourneyReadinessService {
  computeJourneyReadiness(
    citizenFacts: Record<string, unknown>,
    steps: ApplicationJourneyStepDto[],
    checklist: ApplicationChecklistDto,
  ): JourneyReadinessDto {
    let citizenFactsPercentage = 0;
    if (citizenFacts.bankAccountNumber && citizenFacts.aadhaarNumber) citizenFactsPercentage = 100;
    else if (citizenFacts.bankAccountNumber || citizenFacts.aadhaarNumber) citizenFactsPercentage = 50;

    const documentsPercentage = citizenFacts.landHolding ? 100 : 50;
    const evidencePercentage = 80;
    const verificationPercentage = 90;

    const completedStepsCount = steps.filter((s) => s.status === 'COMPLETED').length;
    const applicationStatusPercentage = steps.length > 0 ? (completedStepsCount / steps.length) * 100 : 0;

    const dependencyPercentage = 100;
    const missingItemsCount = checklist?.items?.filter((i) => i.status !== 'COMPLETED').length || 0;

    const score = Math.round(
      citizenFactsPercentage * 0.2 +
        documentsPercentage * 0.2 +
        evidencePercentage * 0.15 +
        verificationPercentage * 0.15 +
        applicationStatusPercentage * 0.15 +
        dependencyPercentage * 0.15,
    );

    return {
      score,
      citizenFactsPercentage,
      documentsPercentage,
      evidencePercentage,
      verificationPercentage,
      applicationStatusPercentage,
      dependencyPercentage,
      missingItemsCount,
    };
  }
}
