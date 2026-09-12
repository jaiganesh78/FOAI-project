# Recommendation Generation Pipeline

## Pipeline Workflow
1. **Eligibility Context Ingestion**: Reads verified eligibility results from Sprint 5.
2. **Strategy Selection**: Strategy factory instantiates the target `IRecommendationStrategy`.
3. **Candidate Utility Scoring**: Computes Benefit, Urgency, Preference, Readiness, Difficulty, and Deadline scores.
4. **Readiness Evaluation**: Classifies candidate readiness into `READY`, `PARTIALLY_READY`, `MISSING_DOCUMENTS`, or `NOT_READY`.
5. **Portfolio Optimization**: Deduplicates conflicting benefits and formats optimized portfolio.
6. **Snapshotting & Persistence**: Creates immutable `RecommendationSnapshot` with `RecommendationGenerationContext`.
