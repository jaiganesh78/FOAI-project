# Enterprise Recommendation Intelligence & Personalized Opportunity Platform

## Overview
The **Recommendation Intelligence & Personalized Opportunity Platform** is responsible for transforming deterministic eligibility results (Sprint 5) into prioritized, personalized, explainable, and actionable scheme recommendations and portfolio optimizations.

It is NOT an AI engine. Every decision is rule-based, reproducible, versioned, and audit-ready.

---

## Key Features
- **Recommendation Strategy Framework (`IRecommendationStrategy` & `RecommendationStrategyFactory`)**: Pluggable strategy pattern decoupling generation from ranking algorithms (`UtilityRecommendationStrategy`, `CitizenPreferenceStrategy`, `PriorityRecommendationStrategy`, `EmergencyRecommendationStrategy`, `AIRecommendationStrategy`).
- **Scoring Breakdown (`RecommendationScoreBreakdown`)**: Persists every component score (Benefit, Urgency, Preference, Readiness, Difficulty, Deadline Bonus) → Final Utility (0-100).
- **Application Readiness Engine (`ApplicationReadinessService`)**: Computes readiness status (`READY`, `PARTIALLY_READY`, `MISSING_DOCUMENTS`, `NOT_READY`).
- **Portfolio Optimization (`RecommendationPortfolioOptimizer`)**: Deduplicates benefits and prevents conflicting scheme recommendations.
- **Immutable Recommendation Context & Replay (`RecommendationGenerationContext` & `RecommendationReplayService`)**: Replays historical recommendations with 100% deterministic precision.
- **Feedback Foundation (`RecommendationFeedback`)**: Stores citizen interaction signals (`VIEWED`, `SAVED`, `APPLIED`, `DISMISSED`).
- **Operational Analytics (`RecommendationAnalyticsService`)**: Captures latency metrics, average scores, benefit totals, and failure rates.

---

## Directory Structure
```
src/modules/recommendation/
├── controllers/
│   └── recommendation.controller.ts
├── strategies/
│   ├── recommendation-strategy.interface.ts
│   ├── utility-recommendation.strategy.ts
│   └── recommendation-strategy.factory.ts
├── services/
│   ├── recommendation-utility.service.ts
│   ├── application-readiness.service.ts
│   ├── recommendation-dependency.service.ts
│   ├── recommendation-portfolio-optimizer.service.ts
│   ├── recommendation-ranking.service.ts
│   ├── recommendation-explanation.service.ts
│   ├── recommendation-snapshot.service.ts
│   ├── recommendation-replay.service.ts
│   ├── recommendation-diff.service.ts
│   ├── recommendation-history.service.ts
│   ├── recommendation-lifecycle.service.ts
│   ├── recommendation-preference.service.ts
│   ├── recommendation-feedback.service.ts
│   ├── recommendation-analytics.service.ts
│   ├── recommendation-generation.service.ts
│   └── recommendation-query.service.ts
├── repositories/
│   ├── recommendation.repository.interface.ts
│   ├── prisma-recommendation.repository.ts
│   ├── recommendation-portfolio.repository.interface.ts
│   ├── prisma-recommendation-portfolio.repository.ts
│   ├── recommendation-snapshot.repository.interface.ts
│   ├── prisma-recommendation-snapshot.repository.ts
│   ├── recommendation-feedback.repository.interface.ts
│   └── prisma-recommendation-feedback.repository.ts
├── README.md
├── sequence-diagram.md
├── recommendation-pipeline.md
├── portfolio-optimization.md
├── ranking-engine.md
├── future-roadmap.md
└── recommendation.module.ts
```
