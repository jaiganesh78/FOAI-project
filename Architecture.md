# Architecture Specification — AI-Powered Government Policy Intelligence Platform (GPIOS)

## 1. System Overview
GPIOS is an enterprise-scale, production-grade AI-Powered Government Policy Intelligence Platform designed to handle complex policy analysis, citizen eligibility evaluation, automated policy indexing, decision copilot capabilities, and deterministic application journey execution.

---

## 2. Architecture & Design Principles
- **Modular Monolith**: Designed as a modular monolith in NestJS with strict Clean Architecture and Domain Driven Design (DDD) domain boundaries (`domain/`, `application/`, `infrastructure/`, `presentation/`).
- **Dependency Injection Tokens**: Centralized Symbols in `src/core/tokens/injection-tokens.ts` (`STORAGE_PROVIDER`, `LLM_PROVIDER`, `EMBEDDING_PROVIDER`, `EVENT_PUBLISHER`, `EVENT_SUBSCRIBER`, `EVENT_DISPATCHER`, `FEATURE_FLAG_PROVIDER`, `CLOCK_PROVIDER`).
- **Event-Driven Decoupling**: Application events are decoupled using abstract interfaces (`IDomainEvent`, `IEventPublisher`, `IEventSubscriber`, `IEventDispatcher`). Infrastructure implementations like BullMQ are treated strictly as adapters.
- **Strict Monorepo Isolation**: Managed via `pnpm` workspaces separating `apps/frontend`, `apps/backend`, and `packages/shared`.
- **Zero Process.Env Direct Access**: All configuration is accessed exclusively through modular Zod-validated configuration modules (`AppConfig`, `DatabaseConfig`, `RedisConfig`, `StorageConfig`, `AIConfig`, `MonitoringConfig`, `SecurityConfig`).

---

## 3. Core Modules Specification

### Core Foundation (`apps/backend/src/core/`)
- **`tokens/`**: Centralized Injection Symbols (`STORAGE_PROVIDER`, `LLM_PROVIDER`, `EMBEDDING_PROVIDER`, `EVENT_PUBLISHER`, `EVENT_SUBSCRIBER`, `EVENT_DISPATCHER`, `FEATURE_FLAG_PROVIDER`, `CLOCK_PROVIDER`).
- **`common/`**: Reusable base building blocks (`BaseController`, `BaseService`, `BaseRepository`, `BaseDto`, `Result<T,E>`).
- **`config/`**: Modular Zod-validated configuration namespaces.
- **`logger/`**: Pino structured logging with AsyncLocalStorage correlation context propagation (`CorrelationMiddleware`).
- **`error/`**: Global Exception Filter (`AllExceptionsFilter`) & unified API Response Interceptor (`ApiResponseInterceptor`).
- **`event-bus/`**: Abstract event dispatcher and BullMQ event adapter (`BullMQEventAdapter`).
- **`storage/`**: `IStorageProvider` interface & AWS S3 adapter (`S3StorageAdapter`).
- **`ai-provider/`**: `ILLMProvider` & `IEmbeddingProvider` interfaces (`GeminiLLMAdapter`).
- **`clock/`**: `IClockProvider` & `SystemClockProvider`.
- **`feature-flag/`**: `IFeatureFlagProvider` & `InMemoryFeatureFlagAdapter`.
- **`health/`**: Triple health check probes (`/health`, `/health/ready`, `/health/live`).

### Domain Modules (`apps/backend/src/modules/`)
1. **`Citizen`**: Citizen profile management and history scaffolding.
2. **`Knowledge`**: Policy knowledge base, document ingestion scaffolding.
3. **`Policy`**: Policy definitions, rule scaffolding.
4. **`Eligibility`**: Policy eligibility evaluation engine scaffolding.
5. **`Recommendation`**: Policy recommendations & matching platform.
6. **`ApplicationJourney`**: Action planning & application journey execution platform.
7. **`AI`**: Core LLM orchestration & LangChain/LangGraph workflow scaffolding.
8. **`Companion`**: Conversational citizen companion agent scaffolding.
9. **`Copilot`**: Policy administrator copilot assistant scaffolding.
10. **`Admin`**: System administrative operations & audit scaffolding.
11. **`Notification`**: Multi-channel notification pipeline scaffolding.

---

## 4. Shared Package Structure (`packages/shared/`)
- `constants/`: Global application-wide constants.
- `enums/`: System-wide domain enumerations.
- `events/`: Domain event contract declarations.
- `interfaces/`: Core entity and contract definitions (`StandardApiResponse<T>`, `ComponentHealthStatus`).
- `types/`: Utility type definitions (`Nullable<T>`, `Optional<T>`, `DeepPartial<T>`).
- `dtos/`: Cross-boundary DTO definitions (`PaginationQueryDto`).
- `schemas/`: Reusable Zod schemas (`paginationSchema`, `uuidSchema`).
- `validators/`: Custom Zod validation rules (`isUuidValid`).
- `custom-errors/`: Custom error hierarchy definitions (`DomainException`, `NotFoundException`).
- `utils/`: Reusable functional utilities (`sanitizeString`, `sleep`).

---

## 5. Database & Vector Strategy
- **Relational Storage**: PostgreSQL 16 managed via Prisma ORM.
- **Vector Indexing**: `pgvector` extension for high-performance policy chunk vector search.

---

## 6. Infrastructure & Deployment
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS + ShadCN UI + Zustand + TanStack Query. Target: Vercel.
- **Backend**: NestJS 11 + Prisma + Redis + BullMQ. Target: Railway / AWS.
- **Containerization**: Docker Compose with PostgreSQL (`pgvector/pgvector:pg16`) and Redis 7.

---

## 7. Sprint History
- **Sprint 0**: Enterprise Foundation & Engineering Infrastructure established (pnpm locking, Clean Architecture, DI tokens, modular configs, event bus abstraction, unified API response envelope, Pino correlation middleware, S3/AI/Clock/FeatureFlag abstractions, /health probes, Docker, CI/CD, documentation & testing foundation).
- **Sprint 1**: Identity & Access Management (IAM) Foundation implemented (Argon2id password hashing, dual JWT Access/Refresh tokens with rotation and token family reuse revocation, polymorphic `AuthIdentity` model, RBAC system roles & granular permissions, `@RequirePermissions` / `@RequireRoles` / `@CurrentUser` / `@Public` decorators, `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, session tracking & revocation endpoints, 5-attempt/15-min account lockout, audit logging, soft delete, optimistic concurrency, configuration-driven auth, and 100% verified unit/integration/E2E test suite).
- **Sprint 2**: Citizen Intelligence Foundation implemented (Entity–Attribute–Value [EAV] architecture, Master Attribute Registry `CitizenAttributeRegistry` with data types and attribute dependency resolution, reusable `AttributeValidationEngine`, `CitizenCompletenessEngine`, `CitizenSnapshotService` producing point-in-time serialized profile snapshots in `CitizenProfileVersion`, immutable `CitizenFactHistory` versioning, explicit profile state machine `ProfileStatus`, high-level read model `CitizenQueryService`, centralized `DomainEventRegistry` with event versioning, 8 REST endpoints, technical module README, and 100% verified 36/36 unit/integration/E2E test suite).
- **Sprint 3**: Adaptive Citizen Discovery & Progressive Onboarding Engine implemented (Blueprint-driven discovery `DiscoveryBlueprint`, decoupled UI presentation catalog `QuestionCatalog` with rich rendering metadata, `AnswerNormalizationEngine` handling currency/lakhs/crores/booleans/dates, dedicated `QuestionVisibilityEngine` evaluating parent-child attribute dependencies, `DiscoveryContext` object encapsulation, session versioning with audit timeline `OnboardingSessionTimeline`, draft answer support `AnswerStatus`, abstract progress calculation `DefaultProgressCalculationStrategy`, 7 REST endpoints, Next.js 16 + React 19 + Framer Motion frontend UI with Zustand state & `QuestionComponentRegistry`, technical module documentation README/sequence-diagram/future-roadmap, and 100% verified 41/41 unit/integration/E2E test suite).
- **Sprint 4**: Government Knowledge Acquisition & Policy Intelligence Foundation implemented (Knowledge source registry `KnowledgeSource` & `KnowledgeSourceSchedule` with capabilities model, connector abstraction layer `IKnowledgeConnector` with `ApiConnector`, `WebScrapingConnector`, `PdfConnector`, `ManualUploadConnector`, multi-format parsing strategy registry `IParserRegistry` with `PdfParser`, `HtmlParser`, `JsonParser`, `XmlParser`, `PlainTextParser`, policy fingerprinting engine `PolicyFingerprintService` preventing duplicate crawling/parsing, intelligent refresh scheduler `RefreshSchedulerService`, policy lifecycle state machine `PolicyLifecycleStatus` [DISCOVERED → DOWNLOADED → PROCESSED → NORMALIZED → ACTIVE → SUPERSEDED → ARCHIVED], metadata extraction with provenance `MetadataExtractionService`, policy normalization engine `PolicyNormalizationService`, chunk generation engine `ChunkGenerationService` with content-addressable `stableChunkId` and line lineage, quality scoring `KnowledgeQualityReport`, integrity verification `KnowledgeIntegrityVerificationService`, read query & statistics services `IKnowledgeQueryService` & `IKnowledgeStatisticsService`, 12 REST endpoints, complete documentation suite README/sequence-diagram/future-roadmap/knowledge-ingestion-pipeline/policy-versioning, and 100% verified 58/58 unit/integration/E2E test suite).
- **Sprint 5**: Enterprise Eligibility Intelligence Engine & Decision Trace Platform implemented (Policy validation stage `PolicyValidationService`, immutable rule versioning `PolicyRuleVersion`, rule cost metadata `RuleEvaluationCost` & topological planner `EvaluationExecutionPlanner` sorting low-cost rules first, rule compilation cache `CompiledRuleCacheService`, fact usage index `FactUsageIndexService` pruning unneeded graph traversals, template-driven explainability `ExplainabilityService` using `ExplainabilityTemplate` parameters, decision replay engine `DecisionReplayService` matching historical decisions with 100% precision, benefit & opportunity intelligence engines `BenefitIntelligenceService` & `OpportunityIntelligenceService`, metrics service `EvaluationMetricsService`, top-level `EligibilityEvaluationOrchestrator`, 13 REST endpoints in `EligibilityController`, complete documentation suite README/sequence-diagram/future-roadmap/decision-trace/evaluation-graph, and 100% verified 74/74 unit/integration/E2E test suite).
- **Sprint 6**: Enterprise Recommendation Intelligence & Personalized Opportunity Platform implemented (Strategy pattern framework `IRecommendationStrategy` & `RecommendationStrategyFactory` with `UtilityRecommendationStrategy`, scoring breakdown `RecommendationScoreBreakdown` persisting benefit/urgency/preference/readiness/difficulty/deadline component scores, non-AI feedback recording `RecommendationFeedback`, recommendation context snapshotting `RecommendationGenerationContext` with SHA-256 checksums, recommendation replay service `RecommendationReplayService` verifying historical recommendations with 100% precision match, portfolio optimizer `RecommendationPortfolioOptimizer`, application readiness analyzer `ApplicationReadinessService`, diff & change detection `RecommendationDiffService`, lifecycle state machine `RecommendationLifecycleStatus`, preference profile manager `RecommendationPreferenceService`, extended analytics metrics `RecommendationAnalyticsService`, 13 REST endpoints in `RecommendationController`, complete documentation suite README/sequence-diagram/recommendation-pipeline/portfolio-optimization/ranking-engine/future-roadmap, and 100% verified 95/95 unit/integration/E2E test suite).
- **Sprint 7**: Enterprise Action Planning & Application Journey Engine implemented (Blueprint inheritance `parentBlueprintId` from Root -> Domain -> Policy Blueprint, step execution metadata `StepExecutionPolicy`, centralized constraint engine `JourneyConstraintEngine`, dual replay engine `JourneyReplayService` supporting Snapshot Replay & Event Replay, personalized action planner `ActionPlanningService`, checklist generator `ChecklistGenerationService`, deadline intelligence `DeadlineIntelligenceService`, progress calculator `JourneyProgressService`, timeline recorder `JourneyTimelineService`, snapshot generator `JourneySnapshotService`, expanded analytics `JourneyAnalyticsService`, 14 REST endpoints in `ApplicationJourneyController`, complete technical documentation suite README/sequence-diagram/journey-blueprint/action-planner/checklist-engine/dependency-graph/timeline/snapshot-engine/future-roadmap, and 100% verified 124/124 unit/integration/E2E test suite).
