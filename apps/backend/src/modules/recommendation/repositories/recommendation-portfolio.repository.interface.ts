import { RecommendationPortfolio, RecommendationPortfolioItem, RecommendationPriority } from '@prisma/client';

export interface CreateRecommendationPortfolioData {
  userId: string;
  snapshotId: string;
  totalMonetaryValue: number;
  items: {
    policyId: string;
    policyNumber: string;
    policyTitle: string;
    rank: number;
    priority: RecommendationPriority;
    utilityScore: number;
  }[];
}

export interface RecommendationPortfolioWithItems extends RecommendationPortfolio {
  items: RecommendationPortfolioItem[];
}

export interface IRecommendationPortfolioRepository {
  findById(id: string): Promise<RecommendationPortfolioWithItems | null>;
  findLatestByUserId(userId: string): Promise<RecommendationPortfolioWithItems | null>;
  createPortfolio(data: CreateRecommendationPortfolioData): Promise<RecommendationPortfolioWithItems>;
}
