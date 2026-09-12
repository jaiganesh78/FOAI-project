import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IOnboardingQuestionRepository, OnboardingQuestionWithActiveVersion } from './onboarding-question.repository.interface';
import { OnboardingQuestionVersion, QuestionOption, QuestionDependency, QuestionExplanation, QuestionPrioritizationConfig } from '@prisma/client';

@Injectable()
export class PrismaOnboardingQuestionRepository implements IOnboardingQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActiveQuestions(): Promise<OnboardingQuestionWithActiveVersion[]> {
    return this.prisma.onboardingQuestion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
            dependencies: true,
          },
        },
      },
    }) as unknown as OnboardingQuestionWithActiveVersion[];
  }

  async findByQuestionCode(questionCode: string): Promise<OnboardingQuestionWithActiveVersion | null> {
    return this.prisma.onboardingQuestion.findUnique({
      where: { questionCode },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
            dependencies: true,
          },
        },
      },
    }) as unknown as OnboardingQuestionWithActiveVersion | null;
  }

  async findQuestionVersion(questionId: string, version: number): Promise<(OnboardingQuestionVersion & { options: QuestionOption[]; dependencies: QuestionDependency[] }) | null> {
    return this.prisma.onboardingQuestionVersion.findUnique({
      where: { questionId_version: { questionId, version } },
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        dependencies: true,
      },
    }) as unknown as (OnboardingQuestionVersion & { options: QuestionOption[]; dependencies: QuestionDependency[] }) | null;
  }

  async getExplanation(questionId: string): Promise<QuestionExplanation | null> {
    return this.prisma.questionExplanation.findFirst({
      where: { questionId },
    });
  }

  async getActivePrioritizationConfig(): Promise<QuestionPrioritizationConfig | null> {
    return this.prisma.questionPrioritizationConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });
  }
}
