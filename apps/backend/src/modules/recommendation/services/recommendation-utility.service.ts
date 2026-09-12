import { Injectable } from '@nestjs/common';
import { RecommendationScoreBreakdownDto } from '@gpios/shared';

@Injectable()
export class RecommendationUtilityService {
  computeUtilityScore(
    policy: { id: string; title: string; documentNumber: string },
    citizenFacts: Record<string, unknown>,
    preferences?: { preferredCategories?: string[]; prioritizeMonetaryValue?: boolean; prioritizeUrgency?: boolean },
  ): RecommendationScoreBreakdownDto {
    let benefitScore = 20;
    let urgencyScore = 15;
    let preferenceScore = 15;
    let readinessScore = 15;
    let difficultyScore = 10;
    let deadlineBonus = 5;

    const titleLower = policy.title.toLowerCase();

    if (titleLower.includes('kisan') || titleLower.includes('farmer')) {
      benefitScore += 10;
      if (citizenFacts.landHolding) readinessScore += 5;
    } else if (titleLower.includes('grant') || titleLower.includes('scholarship')) {
      benefitScore += 15;
    }

    if (preferences?.prioritizeMonetaryValue) benefitScore += 5;
    if (preferences?.prioritizeUrgency) urgencyScore += 5;

    const rawUtility = benefitScore + urgencyScore + preferenceScore + readinessScore + difficultyScore + deadlineBonus;
    const finalUtilityScore = Math.min(100, Math.max(0, rawUtility));

    return {
      benefitScore,
      urgencyScore,
      preferenceScore,
      readinessScore,
      difficultyScore,
      deadlineBonus,
      finalUtilityScore,
    };
  }
}
