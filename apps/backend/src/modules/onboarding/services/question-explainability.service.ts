import { Inject, Injectable } from '@nestjs/common';
import { ONBOARDING_QUESTION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IOnboardingQuestionRepository } from '../repositories/onboarding-question.repository.interface';
import { QuestionExplanationDto } from '@gpios/shared';

@Injectable()
export class QuestionExplainabilityService {
  constructor(
    @Inject(ONBOARDING_QUESTION_REPOSITORY) private readonly repo: IOnboardingQuestionRepository,
  ) {}

  async getExplanation(questionId: string, attributeKey: string): Promise<QuestionExplanationDto> {
    const record = await this.repo.getExplanation(questionId);
    if (record) {
      return {
        questionId: record.questionId,
        questionCode: record.questionCode,
        explanation: record.explanation,
        requiredForSchemes: (record.requiredForSchemes as string[]) || [],
        unlockedRecommendations: (record.unlockedRecommendations as string[]) || [],
        missingPrerequisiteForJourneys: (record.missingPrerequisiteForJourneys as string[]) || [],
      };
    }

    return {
      questionId,
      questionCode: `Q_${attributeKey.toUpperCase()}`,
      explanation: `This question is required to evaluate eligibility and unlock recommendations for attribute '${attributeKey}'.`,
      requiredForSchemes: ['PM-KISAN', 'NSP Scholarship'],
      unlockedRecommendations: ['Agricultural Credit Subvention'],
      missingPrerequisiteForJourneys: ['Application Document Submission'],
    };
  }
}
