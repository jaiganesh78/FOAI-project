import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { RecommendationPreferenceInputDto } from '@gpios/shared';

@Injectable()
export class RecommendationPreferenceService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getUserPreference(userId: string) {
    const pref = await this.prisma.recommendationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      return {
        preferredCategories: ['AGRICULTURE', 'SOCIAL_WELFARE'],
        maxDifficultyTolerance: 3,
        prioritizeMonetaryValue: true,
        prioritizeUrgency: true,
      };
    }
    return {
      preferredCategories: pref.preferredCategories as string[],
      maxDifficultyTolerance: pref.maxDifficultyTolerance,
      prioritizeMonetaryValue: pref.prioritizeMonetaryValue,
      prioritizeUrgency: pref.prioritizeUrgency,
    };
  }

  async updateUserPreference(userId: string, dto: RecommendationPreferenceInputDto) {
    return this.prisma.recommendationPreference.upsert({
      where: { userId },
      update: {
        preferredCategories: dto.preferredCategories,
        maxDifficultyTolerance: dto.maxDifficultyTolerance ?? 3,
        prioritizeMonetaryValue: dto.prioritizeMonetaryValue ?? true,
        prioritizeUrgency: dto.prioritizeUrgency ?? true,
        version: { increment: 1 },
      },
      create: {
        userId,
        preferredCategories: dto.preferredCategories,
        maxDifficultyTolerance: dto.maxDifficultyTolerance ?? 3,
        prioritizeMonetaryValue: dto.prioritizeMonetaryValue ?? true,
        prioritizeUrgency: dto.prioritizeUrgency ?? true,
      },
    });
  }
}
