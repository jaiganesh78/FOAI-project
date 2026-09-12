import { Injectable, Logger } from '@nestjs/common';
import { ScoredPolicyCandidate } from '../strategies/recommendation-strategy.interface';
import { RecommendationPriority, RecommendationScoreBreakdownDto } from '@gpios/shared';

export interface OptimizedPortfolioItem {
  policyId: string;
  policyNumber: string;
  policyTitle: string;
  rank: number;
  priority: RecommendationPriority;
  utilityScore: number;
  scoreBreakdown: RecommendationScoreBreakdownDto;
}

@Injectable()
export class RecommendationPortfolioOptimizer {
  private readonly logger = new Logger(RecommendationPortfolioOptimizer.name);

  optimizePortfolio(candidates: ScoredPolicyCandidate[]): {
    items: OptimizedPortfolioItem[];
    totalMonetaryValue: number;
  } {
    this.logger.log(`Optimizing portfolio for ${candidates.length} candidates.`);

    const items: OptimizedPortfolioItem[] = [];
    let totalMonetaryValue = 0;
    const seenTitles = new Set<string>();

    candidates.forEach((cand, index) => {
      // Deduplicate conflicting or duplicate scheme titles
      if (seenTitles.has(cand.policyTitle)) return;
      seenTitles.add(cand.policyTitle);

      const rank = index + 1;
      let priority = RecommendationPriority.MEDIUM;
      if (rank === 1 || cand.utilityScore >= 80) priority = RecommendationPriority.CRITICAL;
      else if (cand.utilityScore >= 60) priority = RecommendationPriority.HIGH;
      else if (cand.utilityScore < 40) priority = RecommendationPriority.LOW;

      items.push({
        policyId: cand.policyId,
        policyNumber: cand.policyNumber,
        policyTitle: cand.policyTitle,
        rank,
        priority,
        utilityScore: cand.utilityScore,
        scoreBreakdown: cand.scoreBreakdown,
      });

      if (cand.policyTitle.toLowerCase().includes('kisan')) {
        totalMonetaryValue += 6000;
      } else {
        totalMonetaryValue += 10000;
      }
    });

    return { items, totalMonetaryValue };
  }
}
