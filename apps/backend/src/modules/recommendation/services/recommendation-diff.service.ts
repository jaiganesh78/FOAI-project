import { Injectable } from '@nestjs/common';
import { RecommendationDifferenceDto, RecommendationChangeType } from '@gpios/shared';

export interface PortfolioItemLike {
  policyId: string;
  policyTitle: string;
  rank: number;
  utilityScore: number;
}

@Injectable()
export class RecommendationDiffService {
  computeDiff(oldPortfolioItems: PortfolioItemLike[], newPortfolioItems: PortfolioItemLike[]): RecommendationDifferenceDto[] {
    const diffs: RecommendationDifferenceDto[] = [];
    const oldMap = new Map<string, PortfolioItemLike>(oldPortfolioItems.map((item) => [item.policyId, item]));

    for (const newItem of newPortfolioItems) {
      const oldItem = oldMap.get(newItem.policyId);
      if (!oldItem) {
        diffs.push({
          changeType: RecommendationChangeType.ADDED,
          policyId: newItem.policyId,
          policyTitle: newItem.policyTitle,
          newRank: newItem.rank,
          newUtilityScore: newItem.utilityScore,
          details: `Newly recommended scheme at rank #${newItem.rank}`,
        });
      } else {
        oldMap.delete(newItem.policyId);
        if (oldItem.rank !== newItem.rank) {
          diffs.push({
            changeType: RecommendationChangeType.MOVED,
            policyId: newItem.policyId,
            policyTitle: newItem.policyTitle,
            oldRank: oldItem.rank,
            newRank: newItem.rank,
            oldUtilityScore: oldItem.utilityScore,
            newUtilityScore: newItem.utilityScore,
            details: `Rank changed from #${oldItem.rank} to #${newItem.rank}`,
          });
        }
      }
    }

    oldMap.forEach((oldItem) => {
      diffs.push({
        changeType: RecommendationChangeType.REMOVED,
        policyId: oldItem.policyId,
        policyTitle: oldItem.policyTitle,
        oldRank: oldItem.rank,
        details: `Scheme no longer recommended`,
      });
    });

    return diffs;
  }
}
