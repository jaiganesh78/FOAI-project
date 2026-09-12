import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class RecommendationDependencyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async resolveDependencies(policyIds: string[]): Promise<{
    prerequisitesMap: Record<string, string[]>;
    unlockedMap: Record<string, string[]>;
  }> {
    const deps = await this.prisma.recommendationDependency.findMany({
      where: { sourcePolicyId: { in: policyIds } },
    });

    const prerequisitesMap: Record<string, string[]> = {};
    const unlockedMap: Record<string, string[]> = {};

    for (const d of deps) {
      if (d.dependencyType === 'REQUIRES') {
        if (!prerequisitesMap[d.sourcePolicyId]) prerequisitesMap[d.sourcePolicyId] = [];
        prerequisitesMap[d.sourcePolicyId].push(d.targetPolicyId);
      } else if (d.dependencyType === 'UNLOCKS') {
        if (!unlockedMap[d.sourcePolicyId]) unlockedMap[d.sourcePolicyId] = [];
        unlockedMap[d.sourcePolicyId].push(d.targetPolicyId);
      }
    }

    return { prerequisitesMap, unlockedMap };
  }
}
