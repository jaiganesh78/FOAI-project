import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class OnboardingAnalyticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async trackQuestionAnswered(blueprintId: string, stepKey: string): Promise<void> {
    await this.prisma.onboardingAnalytics.upsert({
      where: { blueprintId_stepKey: { blueprintId, stepKey } },
      update: {
        revisitCount: { increment: 1 },
      },
      create: {
        blueprintId,
        stepKey,
        revisitCount: 1,
      },
    });
  }

  async trackValidationFailure(blueprintId: string, stepKey: string): Promise<void> {
    await this.prisma.onboardingAnalytics.upsert({
      where: { blueprintId_stepKey: { blueprintId, stepKey } },
      update: {
        validationRetryRate: { increment: 1.0 },
      },
      create: {
        blueprintId,
        stepKey,
        validationRetryRate: 1.0,
      },
    });
  }
}
