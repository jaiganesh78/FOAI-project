import { Inject, Injectable } from '@nestjs/common';
import { ONBOARDING_QUESTION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IOnboardingQuestionRepository } from '../repositories/onboarding-question.repository.interface';
import { DeterministicQuestionImpactScoreDto, PrioritizationTieBreakerReason } from '@gpios/shared';

@Injectable()
export class QuestionPrioritizationEngineService {
  constructor(
    @Inject(ONBOARDING_QUESTION_REPOSITORY) private readonly repo: IOnboardingQuestionRepository,
  ) {}

  async calculatePrioritization(questions: Array<{
    questionId: string;
    questionCode: string;
    questionVersionId: string;
    attributeKey: string;
    priority: number;
    inputType: string;
  }>): Promise<DeterministicQuestionImpactScoreDto[]> {
    const config = await this.repo.getActivePrioritizationConfig();
    const w1 = config ? config.eligibilityRelevanceWeight : 0.35;
    const w2 = config ? config.recommendationUnlockWeight : 0.25;
    const w3 = config ? config.criticalFactImpactWeight : 0.20;
    const w4 = config ? config.downstreamDependencyWeight : 0.15;
    const w5 = config ? config.citizenEffortPenaltyWeight : 0.05;
    const configVersion = config ? config.version : 1;

    const scored: DeterministicQuestionImpactScoreDto[] = questions.map((q) => {
      let eligibilityRelevanceScore = 50;
      if (['annualIncome', 'isLandOwner', 'residenceState'].includes(q.attributeKey)) {
        eligibilityRelevanceScore = 95;
      }

      let recommendationUnlockScore = 40;
      if (['occupationCategory', 'casteCategory'].includes(q.attributeKey)) {
        recommendationUnlockScore = 90;
      }

      let criticalFactImpactScore = 50;
      if (['annualIncome', 'residenceState'].includes(q.attributeKey)) {
        criticalFactImpactScore = 90;
      }

      const downstreamDependencyScore = q.priority * 10;
      const citizenEffortPenalty = q.inputType === 'DOCUMENT_REQUIRED' ? 20 : 5;

      const deterministicQuestionImpactScore = Math.round(
        eligibilityRelevanceScore * w1 +
          recommendationUnlockScore * w2 +
          criticalFactImpactScore * w3 +
          downstreamDependencyScore * w4 -
          citizenEffortPenalty * w5,
      );

      return {
        questionId: q.questionId,
        questionCode: q.questionCode,
        questionVersionId: q.questionVersionId,
        attributeKey: q.attributeKey,
        deterministicQuestionImpactScore,
        eligibilityRelevanceScore,
        recommendationUnlockScore,
        criticalFactImpactScore,
        downstreamDependencyScore,
        citizenEffortPenalty,
        configurationVersion: configVersion,
        prioritizationRationale: `Deterministic Impact Score = ${deterministicQuestionImpactScore} (Eligibility: ${eligibilityRelevanceScore}, RecUnlock: ${recommendationUnlockScore}, Critical: ${criticalFactImpactScore}, Downstream: ${downstreamDependencyScore}, Effort: -${citizenEffortPenalty})`,
      };
    });

    // 5-step deterministic tie-breaking sorting
    return scored.sort((a, b) => {
      if (b.deterministicQuestionImpactScore !== a.deterministicQuestionImpactScore) {
        return b.deterministicQuestionImpactScore - a.deterministicQuestionImpactScore;
      }
      if (b.eligibilityRelevanceScore !== a.eligibilityRelevanceScore) {
        a.tieBreakerReason = PrioritizationTieBreakerReason.HIGHER_ELIGIBILITY_RELEVANCE;
        return b.eligibilityRelevanceScore - a.eligibilityRelevanceScore;
      }
      if (b.criticalFactImpactScore !== a.criticalFactImpactScore) {
        a.tieBreakerReason = PrioritizationTieBreakerReason.HIGHER_DOWNSTREAM_IMPACT;
        return b.criticalFactImpactScore - a.criticalFactImpactScore;
      }
      if (b.recommendationUnlockScore !== a.recommendationUnlockScore) {
        a.tieBreakerReason = PrioritizationTieBreakerReason.HIGHER_RECOMMENDATION_UNLOCK;
        return b.recommendationUnlockScore - a.recommendationUnlockScore;
      }
      if (a.citizenEffortPenalty !== b.citizenEffortPenalty) {
        a.tieBreakerReason = PrioritizationTieBreakerReason.LOWER_CITIZEN_EFFORT;
        return a.citizenEffortPenalty - b.citizenEffortPenalty;
      }
      a.tieBreakerReason = PrioritizationTieBreakerReason.STABLE_QUESTION_VERSION_ID;
      return a.questionVersionId.localeCompare(b.questionVersionId);
    });
  }
}
