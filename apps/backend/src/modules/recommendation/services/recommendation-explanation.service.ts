import { Injectable } from '@nestjs/common';
import { RecommendationExplanationDto } from '@gpios/shared';

@Injectable()
export class RecommendationExplanationService {
  generateExplanation(
    policyId: string,
    _policyTitle: string,
    rank: number,
    scoreBreakdown: { benefitScore: number; urgencyScore: number; finalUtilityScore: number },
    readinessStatus: string,
  ): RecommendationExplanationDto {
    const primaryReason = `Ranked #${rank} with high utility score of ${scoreBreakdown.finalUtilityScore}/100.`;

    const contributingFactors = [
      `Benefit Contribution: +${scoreBreakdown.benefitScore} pts`,
      `Urgency Contribution: +${scoreBreakdown.urgencyScore} pts`,
      `Application Readiness Status: ${readinessStatus}`,
    ];

    const readinessNotice =
      readinessStatus === 'READY'
        ? 'All required documents verified. Application ready for instant submission.'
        : 'Additional document uploads required to achieve full application readiness.';

    return {
      policyId,
      rank,
      primaryReason,
      contributingFactors,
      readinessNotice,
    };
  }
}
