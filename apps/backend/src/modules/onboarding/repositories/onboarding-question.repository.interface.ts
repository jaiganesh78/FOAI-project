import { OnboardingQuestion, OnboardingQuestionVersion, QuestionOption, QuestionDependency, QuestionExplanation, QuestionPrioritizationConfig } from '@prisma/client';

export type OnboardingQuestionWithActiveVersion = OnboardingQuestion & {
  versions: (OnboardingQuestionVersion & {
    options: QuestionOption[];
    dependencies: QuestionDependency[];
  })[];
};

export interface IOnboardingQuestionRepository {
  findAllActiveQuestions(): Promise<OnboardingQuestionWithActiveVersion[]>;
  findByQuestionCode(questionCode: string): Promise<OnboardingQuestionWithActiveVersion | null>;
  findQuestionVersion(questionId: string, version: number): Promise<(OnboardingQuestionVersion & { options: QuestionOption[]; dependencies: QuestionDependency[] }) | null>;
  getExplanation(questionId: string): Promise<QuestionExplanation | null>;
  getActivePrioritizationConfig(): Promise<QuestionPrioritizationConfig | null>;
}
