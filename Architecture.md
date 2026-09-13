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
- **Sprint 8**: Document Intelligence & Evidence Management Platform implemented (Document ingestion pipeline, multi-modal classification `DocumentClassificationService`, OCR & quality assessment `DocumentQualityAssessmentService`, evidence trust scoring `EvidenceTrustScoreService`, lifecycle state machine `DocumentLifecycleService`, document requirement engine `DocumentRequirementService`, models in Prisma `schema.prisma` lines 1789-1896, and verified unit/integration test suite).
- **Sprint 9**: Enterprise Citizen Knowledge Profile & Adaptive Onboarding Platform implemented (Canonical `CitizenFact` single source of truth, schema-driven citizen knowledge profile, immutable fact history versioning `CitizenFactVersion`, dynamic completeness calculation, adaptive onboarding question generation, models in Prisma `schema.prisma` line 2269, tokens in `injection-tokens.ts`, and verified unit/integration test suite).
- **Sprint 10**: Enterprise Fact Verification, Evidence Reconciliation & Citizen Truth Engine implemented (Conflict-aware truth engine, evidence-backed fact reconciliation, immutable `FactVerificationResolution` audit log, canonical `CitizenFact` versioning updates, automated trust score propagation, models in Prisma `schema.prisma` line 2543, tokens in `injection-tokens.ts`, and verified unit/integration test suite).
- **Sprint 11**: Enterprise Continuous Decision Re-evaluation, Impact Propagation & Policy Change Intelligence Platform implemented (Continuous re-evaluation pipeline, `DecisionDiff` calculation with materiality gate [`isMaterial === true`], upstream policy change triggers, event bus publishing [`decision.state_changed`], multi-layer impact propagation, models in Prisma `schema.prisma` line 2679, tokens in `injection-tokens.ts`, and verified 46-scenario unit/integration test suite).
- **Sprint 12**: Enterprise Citizen Notification, Action Center, Multi-Channel Delivery & Decision Communication Platform implemented. **IMPLEMENTED** components: `NotificationOrchestratorService`, `NotificationIngestionService`, `NotificationPolicyService`, `NotificationRendererService`, `SupersessionService`, `ChannelResolutionService`, `NotificationOutboxService` (with exponential backoff DEF-006), `NotificationReplayService` (snapshot-driven, DEF-003), `ActionCenterService`, `NotificationAnalyticsService`, `PrismaNotificationRepository` (atomic lease acquisition DEF-001, CAS version-guarded updates DEF-002), four channel adapters (IN_APP/EMAIL/SMS/PUSH — stubs), `NotificationController` (JwtAuthGuard, ownership boundary), `ActionCenterController` (JwtAuthGuard, ownership boundary). **PLANNED / NOT_IMPLEMENTED**: real provider integrations (SES, Twilio, FCM, WebSocket), PostgreSQL concurrent isolation tests, HTTP supertest suite. Migration `20260812034959_sprint12_remediation_fields` applied to `gpios_db` and verified (`DATABASE_SCHEMA_VERIFIED`). Test baseline: 153/153 notification tests pass; 319/319 full backend tests pass.
- **Sprint 12B**: Candidate Retrieval & Semantic Alignment Foundation implemented.
  - **[HISTORICAL S12B INITIAL / PRE-H1-H2]**: Bridges raw citizen facts to the frozen V1 Semantic Core via `SemanticAlignmentService`, projects safe applicability signals without mutating citizen facts or policy versions, filters active policy versions via `PrismaCandidateRetrievalRepository`, orchestrates hybrid relevance scoring with deterministic tie-breaking in `CandidateRetrievalService`, integrates the `IVectorSearchProvider` abstraction with `DeterministicVectorTestAdapter` (cosine similarity on deterministic query and fixture chunk vectors), validates API requests via strict Zod schemas (`candidateRetrievalRequestSchema.strict()`), preserves policy version safety and provenance, strips sensitive PII at ingress, strictly maintains categorical distinctions (`policyClassification != beneficiaryCategory`, `socialCategory != ewsStatus`), guarantees truthful failure states (`RETRIEVAL_FAILURE` vs `PARTIAL_RESULTS` vs `NO_RESULTS`), and enforces zero eligibility decision fields. Tracked integration gaps: `GAP-RET-001` (production vector persistence deferred) and `GAP-RET-002` (ContextEngineService integration deferred to S13). Baseline progression: 80 test files (+3), 377 backend tests (+29), 0 TypeScript errors, 1 Prisma migration (up to date).
  - **[CURRENT / FINAL S12B CLOSURE]**: Completed Final Architectural Hardening (H1 + H2). H1 structurally separates server-authoritative citizen facts (`authoritativeCitizenFacts`, loaded strictly server-side from `CitizenQueryService`) from caller exploratory hints (`retrievalHints`), establishing the S13 eligibility firewall boundary (`extractS13AuthoritativeContext`). H2 decouples vector retrieval from structured candidate IDs, running independent vector discovery across active policy versions (`corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS'`), unioning and deduplicating by exact `PolicyVersionId`, resolving missing metadata via `findCandidatePolicyVersionsByIds`, and providing truthful evidence with zero fabricated structured match flags. Tracked integration gaps: `GAP-RET-001` (production pgvector persistence deferred), `GAP-RET-002` (ContextEngineService upstream integration deferred to S13), and `GAP-RET-003` (production-scale query optimization deferred for production database tuning). Final status: 83 test files, 472 backend tests, 124 candidate retrieval tests across 6 files, 29 semantic contract tests across 1 file, 153 S12B domain tests across 7 files, 0 TypeScript errors, 0 database drift. **Sprint 12B CLOSED**.

---

## 8. Architecture Status

### CURRENT: Architecture Status as of 2026-09-13 (S12B Final Closure)

#### Database

| Item | Status |
|------|--------|
| PostgreSQL | 18.3 running on localhost:5432 |
| Database | `gpios_db` |
| pgvector | 0.8.1 — installed and available |
| Migration | `20260812034959_sprint12_remediation_fields` — APPLIED (`DATABASE_SCHEMA_VERIFIED`) |
| Schema drift | None (Database schema is up to date!) |

#### Test Suite (Current Verified Metrics)

| Scope | Files | Tests | Status |
|-------|-------|-------|--------|
| Notification module | 2 | 153 | ✅ All pass |
| Candidate Retrieval module (S12B) | 6 | 124 | ✅ All pass |
| Frozen Semantic module | 1 | 29 | ✅ All pass |
| Total S12B Domain Suite | 7 | 153 | ✅ All pass |
| Full backend regression suite | 83 | 472 | ✅ All pass |
| TypeScript (`npx tsc --noEmit`) | — | — | ✅ 0 errors |
| Prisma (`npx prisma migrate status`) | 1 migration | — | ✅ Up to date / 0 drift |

---

### HISTORICAL: Architecture Status as of 2026-09-12 (Pre-H1/H2 Initial Baseline)

#### Test Suite (Historical Pre-H1/H2 Baseline)

| Scope | Files | Tests | Status |
|-------|-------|-------|--------|
| Notification module | 2 | 153 | ✅ All pass |
| Frozen Semantic module | 1 | 29 | ✅ All pass |
| Candidate Retrieval module (S12B Initial) | 3 | 29 | ✅ All pass |
| Full backend (Initial S12B) | 80 | 377 | ✅ All pass |
| TypeScript | — | — | ✅ 0 errors |

### Sprint 12 Defects

| Defect | Status | Evidence Tier |
|--------|--------|---------------|
| DEF-001: TOCTOU lease race | FIXED + REPOSITORY_SPY verified | REPOSITORY_SPY |
| DEF-002: Non-atomic CAS | FIXED + REPOSITORY_SPY verified | REPOSITORY_SPY |
| DEF-003: Replay uses rendered text | FIXED + mutation-verified | UNIT_BEHAVIORAL |
| DEF-005: Notification Zero-AI Boundary | Notification processing zero-AI verified; backend telemetry retains Langfuse | CODE_VERIFIED / PARTIALLY_VERIFIED |
| DEF-006: No retry backoff | FIXED + mutation-verified | UNIT_BEHAVIORAL |

### Implemented vs Planned

**IMPLEMENTED**:
- Full notification orchestration pipeline
- Atomic delivery lease (`updateMany` with WHERE status + OR lease guard)
- CAS version-guarded status updates (`updateMany` with WHERE version)
- Snapshot-driven replay (`templateParameters` JSONB field)
- Exponential backoff retry scheduling (`nextRetryAt` field)
- Action Center (PENDING → ACKNOWLEDGED → COMPLETED/DISMISSED state machine)
- JwtAuthGuard on all notification/action-center endpoints
- Ownership boundary (cross-citizen access denied)
- Role-based guard for analytics/template/policy management endpoints
- S12B Candidate Retrieval & Semantic Alignment (H1 Trust Boundary + H2 True Hybrid Retrieval)

**PLANNED (NOT YET IMPLEMENTED)**:
- Real provider integrations (SES, Twilio/SNS, FCM/APNs, WebSocket in-app)
- PostgreSQL concurrent isolation integration tests
- HTTP supertest suite
- GAP-004 through GAP-014 (see `apps/backend/src/modules/notification/docs/sprint12_final_verification.md`)
- GAP-RET-001 (production pgvector persistence)
- GAP-RET-002 (ContextEngineService upstream integration deferred to S13)
- GAP-RET-003 (production-scale query optimization deferred for production database tuning)

---

## STEP 4R — V1 SEMANTIC CONTRACT REMEDIATION & FREEZE (CANONICAL SEMANTIC LAYER)

### 1. Objective & Architectural Context
Eliminate the architectural weakness where citizen-side attributes were structurally governed (`CitizenAttributeRegistry`) while policy-side conditions (`RuleCondition.attributeKey`) and downstream modules (Recommendation, Journey, Document, Fact Verification) relied on unvalidated, fragmented strings (`landAreaHectares` vs `landHolding` vs `isLandOwner`), inconsistent units, and un-normalized enums.

Following Step 4, a surgical correctness pass (Step 4R) resolved semantic conflations, alias overreach, regional unit invalidity, and documentation overclaims, establishing a hardened, deterministic, policy-safe V1 Semantic Layer bridging:
```
Citizen facts
      ↕
Canonical semantic attributes / controlled values / units
      ↕
Policy rule conditions
      ↕
Eligibility / recommendation / journey reasoning
```

### 2. Implementation Status Breakdown

#### A. IMPLEMENTED & REMEDIATED (Step 4R.1 Frozen Baseline)
- **`packages/shared` V1 Semantic Contracts**:
  - `CanonicalSemanticAttributeCode` enum (`AGRICULTURE.LAND_AREA`, `AGRICULTURE.LAND_OWNERSHIP_STATUS`, `FINANCIAL.ANNUAL_INCOME`, `OCCUPATION.CATEGORY`, `COMMUNITY.SOCIAL_CATEGORY`, `ECONOMIC.EWS_STATUS`, etc.)
  - `SemanticUnit` enum (Base: `HECTARE`, `INR`; Linear variants: `ACRE`, `SQ_METER`, `CENT`, `LAKH`, `CRORE`, `THOUSAND`; Regional non-standard marked as `BIGHA_REGIONAL`)
  - Controlled Enum Values: `CanonicalOccupationCategory`, `CanonicalGender`, `CanonicalSocialCategory` (EWS strictly separated into `ECONOMIC.EWS_STATUS`)
  - Core Interfaces: `CanonicalSemanticAttribute` (authoritative `legacyAttributeKeys: string[]`, deprecated `legacyAttributeKey` invariant), `SemanticAliasMapping` (with `aliasType`), `SemanticUnitConversionRule`, `PolicyDerivedClassification`, `SemanticResolutionResult` (with `reason: SemanticResolutionReason`), `SemanticValidationResult`
  - DTOs and Zod Validation Schemas (`resolveSemanticValueSchema`, `validateSemanticValueSchema`, `convertSemanticUnitSchema`)
- **`SemanticRegistryService` (`apps/backend/src/core/semantic/semantic-registry.service.ts`)**:
  - Frozen V1 Canonical Registry with 11 canonical attributes across 8 syntactic namespaces mapped to 7 underlying `FactCategory` domains
  - Separation of `AGRICULTURE.LAND_AREA` (measurable continuous quantity in hectares) from `AGRICULTURE.LAND_OWNERSHIP_STATUS` (discrete boolean declaration)
  - Separation of `COMMUNITY.SOCIAL_CATEGORY` (`GENERAL`, `OBC`, `SC`, `ST`) from `ECONOMIC.EWS_STATUS` (boolean income criterion)
  - Controlled values enforcement for categorical attributes
  - Context-free deterministic alias resolution: Only unambiguous lexical synonyms (`cultivator`, `kisan`, `krishak`, `agricultural labourer`, `farm labourer`, `salaried employee`, `business owner`) resolve automatically (`EXACT_LEXICAL_ALIAS`)
  - Strict rejection of context-dependent aliases (`farmer`, `agricultural worker`, `government employee`, `private job`, `shopkeeper`) returning `resolved: false, reason: 'CONTEXT_REQUIRED'`
  - Strict rejection of ambiguous phrases (`business`, `business worker`, `business employee`) returning `resolved: false, reason: 'AMBIGUOUS_ALIAS'`
  - Strict rejection of regional units (`BIGHA_REGIONAL`, `BIGHA`, `BIGHA_PUCCA`, `BIGHA_KACCHA`, `GUNTHA`, `KATTHA`, `MARLA`, `KANAL`, `BISWA`) lacking jurisdictional context
  - Deterministic linear unit conversion engine with fixed precision (6 decimal places for area, 2 for currency) and boundary safety (`NaN`, `Infinity`, `> 1e12` rejection)
  - Runtime canonical attribute code format and namespace validation (`validateCanonicalCode`)
  - Authoritative multi-legacy attribute key bridging (`legacyAttributeKeys: string[]`) with codified invariant `legacyAttributeKey === legacyAttributeKeys[0]`
- **`PolicyDerivedClassificationService` (`apps/backend/src/core/semantic/policy-derived-classification.service.ts`)**:
  - Policy-safe boundary enforcement: derived classifications (`SMALL_FARMER`, `MARGINAL_FARMER`, `SCHEME_ELIGIBLE`, etc.) are isolated to `PolicyDerivedClassification` projections
  - Strict guard (`assertNotPolicyDerivedClassification`) preventing policy-derived classifications from polluting universal `CitizenFact` storage
- **`RuleEngineService` Canonical Semantic Integration (`apps/backend/src/modules/eligibility/services/rule-engine.service.ts`)**:
  - Multi-legacy-key bridging via `canonicalAttr.legacyAttributeKeys` (isolated from `isLandOwner`)
  - Structured fact extraction (`{ value, unit }` or companion unit facts)
  - Deterministic unit-aware comparisons in rule condition evaluation
  - Automatic canonical resolution of categorical aliases in rule condition evaluation
  - Strict finite number checks (`Number.isFinite()`) in numeric operators (`GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`, `BETWEEN`), preventing `Infinity`/`-Infinity` from satisfying rules
- **Global `SemanticModule` (`apps/backend/src/core/semantic/semantic.module.ts`)**:
  - Registered in `AppModule` with centralized injection tokens (`SEMANTIC_REGISTRY_SERVICE`, `POLICY_DERIVED_CLASSIFICATION_SERVICE`)
- **Authoritative Test Suite (`test/unit/semantic/semantic-contract.spec.ts`)**:
  - 29 comprehensive behavioral and adversarial tests verifying identity, ownership/area separation, caste/EWS separation, controlled values, exact lexical aliases, context-required alias rejection, ambiguous alias rejection, numerical determinism, epsilon boundaries, finite number guards, regional unit safety, rule engine integration, derived classification isolation, and Zero-AI boundary

#### B. FROZEN CONTRACT (Architecturally Decided & Frozen)
- **Identifier Hierarchy**: Strictly namespaced dot-notation `<DOMAIN_NAMESPACE>.<SUBDOMAIN_OR_CONCEPT>[.<PROPERTY>]` (11 canonical attributes across 8 namespaces mapped to 7 `FactCategory` domains).
- **Context-Free Determinism**: Semantic alias resolution receives no scheme/jurisdiction context and resolves only unambiguous lexical aliases. Context-dependent interpretation requires explicit scheme context and is not automatically guessed.
- **Zero-AI Authority**: LLMs, embeddings, and vector similarity are strictly prohibited from canonicalizing facts, creating aliases, or deciding semantic truth.
- **Raw Provenance Immutability**: Semantic canonicalization never destroys raw citizen input or source document provenance.
- **Policy-Specific Derived Classification Boundary**: Concept of `SMALL_FARMER` is never a universal fact; it is strictly a conditional status derived by a specific policy version.

#### C. TRACKED INTEGRATION GAPS & DOWNSTREAM REALITY
- **GAP-SEM-001 (PLANNED)**: Direct runtime binding of Onboarding `QuestionCatalog` options from `SemanticRegistryService.getControlledValues`. (QuestionCatalog currently uses static seed definitions in Prisma).
- **GAP-SEM-002 (CONTRACT TARGET)**: Automatic OCR unit and alias normalization in Document `ConflictDetectionService` before discrepancy alerts. (Document OCR conflict detection currently uses raw string comparison).
- **GAP-SEM-003 (PLANNED)**: Administrative API / UI for submitting candidate aliases to human reviewers.
- **Fact Verification Status (PARTIALLY VERIFIED)**: Impact engine currently consumes legacy keys (`annualIncome`, `isLandOwner`, `casteCategory`) matching registered bridges, but does not yet consume canonical dot codes directly.
- **Recommendation & Application Journey (CONTRACT ONLY / PLANNED)**: Downstream services reference legacy keys (`citizenFacts.landHolding`) directly; canonical semantic binding is architecturally specified.

#### D. V2 FUTURE ROADMAP (Ontology & Knowledge Graph Explicitly Deferred)
The following capabilities are **EXPLICITLY DEFERRED** to V2 and must **NOT** be introduced in V1:
- Dynamic Graph Ontologies (RDF / OWL / Triplestores / SPARQL)
- Automatic Subsumption Reasoning (Is-A, Part-Of taxonomy traversal)
- Unrestricted Synonym Rings / NLP Wordnet Integration
- Vector-based Semantic Truth / Embedding-driven Canonicalization
- Autonomous AI Semantic Inference
- Jurisdiction-Aware Cadastral Land Unit Engine (State-Specific Bigha)
- Multi-Dimensional Scientific Unit Ontologies (QUDT)
- Cross-jurisdiction Legal Concept Translation Engines
- Database-backed temporal semantic versioning & historical definition time-travel

### 3. Verification Metrics & Baseline Progression

| Stage | Test Files | Total Tests | Candidate Retrieval | Semantic Tests | Notification Tests | TypeScript | Prisma Status | Verdict |
|---|---|---|---|---|---|---|---|---|
| **HISTORICAL: Sprint 12 Baseline** | 76 | 319 | 0 | 0 | 153 | 0 errors | Up to date | B — Strong Baseline |
| **HISTORICAL: Step 4 Initial** | 77 | 344 | 0 | 25 | 153 | 0 errors | Up to date | Provisional |
| **HISTORICAL: Step 4R Remediated Baseline** | 77 | 343 | 0 | 24 | 153 | 0 errors | Up to date | Remediated |
| **HISTORICAL: Step 4R.1 Final Frozen Baseline** | 77 | 348 | 0 | 29 | 153 | 0 errors | Up to date | GREEN — V1 SEMANTIC CONTRACT ACCEPTED / FROZEN |
| **HISTORICAL: S12B Initial** | 80 | 377 | 29 | 29 | 153 | 0 errors | Up to date | AMBER — Verification Identified Integrity Gaps |
| **HISTORICAL: S12B Remediation** | 81 | 430 | 82 | 29 | 153 | 0 errors | Up to date | Staged — Remediation Verified |
| **HISTORICAL: S12B Final Hardening** | 81 | 435 | 87 | 29 | 153 | 0 errors | Up to date | Staged — Prior Hardening Baseline |
| **CURRENT: S12B H1/H2 Final Closure** | **83** | **472** | **124** | **29** | **153** | **0 errors** | **Up to date** | **GREEN — S12B FULLY CLOSED & CERTIFIED FOR SPRINT 13** |

#### Test Count Progression Reconciliation:
1. **Step 4 Initial (344 tests / 25 semantic tests)**: Initial implementation of semantic contracts. Contained 2 defective tests asserting invalid pre-remediation semantics (`BIGHA_PUCCA` universal conversion to `0.2529` ha, generic `"business"` resolving to `BUSINESS_OWNER`).
2. **Step 4R (343 tests / 24 semantic tests)**: Surgical remediation removing the 2 defective tests, separating land area from ownership, separating EWS from caste, and consolidating basic property assertions into structured R1-R14 tests (net 25 → 24 in semantic suite, net 344 → 343 overall).
3. **Step 4R.1 Final (348 tests / 29 semantic tests)**: Final freeze integrity pass resolving the contextual alias contradiction (rejecting `farmer`, `agricultural worker`, `government employee`, `private job`, `shopkeeper`), codifying the `legacyAttributeKeys` invariant, adding reverse land-area/ownership tests, adding finite number guards (`!Number.isFinite`), and testing adversarial canonical codes (net +5 tests in semantic suite, 24 → 29; net 343 → 348 overall across 77 test files with 100% pass rate).
4. **S12B Initial (377 tests / 29 candidate retrieval tests across 3 files)**: Initial implementation of candidate retrieval (9 alignment tests, 7 retrieval tests, 13 adversarial tests). Audit identified 16 integrity and correctness gaps (R1–R16) yielding an AMBER verdict.
5. **S12B Remediation (430 tests / 82 candidate retrieval tests across 4 files)**: Surgical integrity remediation resolving all 16 findings (R1–R16). Authored comprehensive 52-scenario adversarial test suite (`remediation-adversarial.spec.ts`), updated alignment tests (10 tests), candidate retrieval tests (7 tests), and core adversarial tests (13 tests). Full suite progression: 348 → 377 → 430 passed tests across 81 files with 100% pass rate and 0 regressions.
6. **S12B Final Hardening (435 tests / 87 candidate retrieval tests across 4 files)**: Prior hardening pass resolving findings F1–F6. Added tests 53–57 covering PII scrubbing in unresolved inputs/warnings, 3-tier deterministic tie-breaking (`policyVersionId`), conservative long-digit query redaction, authoritative server fact precedence, and client-only fact isolation. Full suite progression: 348 → 377 → 430 → 435 passed tests across 81 files with 100% pass rate, 0 regressions, and 0 TypeScript/Prisma errors.
7. **S12B H1/H2 Final Closure (472 tests / 124 candidate retrieval tests across 6 files / 153 total S12B domain tests across 7 files)**: Final architectural hardening pass resolving H1 (Citizen Fact Trust Boundary) and H2 (True Hybrid Candidate Retrieval). Added `h1-trust-boundary-adversarial.spec.ts` (+15 tests) and `h2-true-hybrid-adversarial.spec.ts` (+22 tests). Candidate retrieval tests: $87 + 15 + 22 = 124$ tests across 6 files. Total S12B domain tests: $124 + 29 = 153$ tests across 7 files. Full backend regression suite: $435 + 15 + 22 = 472$ passed tests across 83 test files with 100% pass rate, 0 regressions, 0 TypeScript errors, and 0 database drift.

---

## SPRINT 12B — CANDIDATE RETRIEVAL & SEMANTIC ALIGNMENT FOUNDATION (FINAL CLOSURE)

### 1. Architectural Scope & Mission
Sprint 12B takes a citizen's profile/context and retrieves a bounded, deduplicated set of candidate policy versions (`PolicyVersion`) based on structured applicability signals, semantic attribute alignment, and an abstraction-ready vector search interface.
- **Core Mission**: Answers *"Which policies are worth evaluating?"* — NEVER *"Is the citizen eligible?"*.
- **V1 Semantic Core Status**: Frozen `SemanticRegistryService` remains the sole semantic authority (**IMPLEMENTED / FROZEN**). 0 modifications to canonical attributes, controlled values, or alias mappings.
- **ContextEngineService Status**: 100% untouched (**DEFERRED TO S13**). Direct execution via `getActivePolicies()` continues in production; wiring candidate retrieval as the upstream evaluation stage is deferred to Sprint 13.
- **H1 Trust Boundary Architecture (HARDENED / VERIFIED)**: Structural separation between server-authoritative citizen profile facts (`authoritativeCitizenFacts`, loaded strictly server-side from `CitizenQueryService`) and caller-provided exploratory hints (`retrievalHints`). Hints can never overwrite server facts, can never enter `canonicalFacts` or `canonicalAttributesPresent`, and can never cross into S13 eligibility evaluation. S12B establishes and tests the authoritative-context extraction boundary that S13 MUST consume. ContextEngine/eligibility integration remains deferred to S13.
- **H2 True Hybrid Retrieval Architecture (HARDENED / VERIFIED)**: Vector search decoupled from structured candidate IDs. Executes independently across active policy versions (`corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS'`). Candidate versions discovered by either channel are unioned and deduplicated by exact `PolicyVersionId`. Vector-only candidates have policy version metadata resolved via `findCandidatePolicyVersionsByIds` and provide truthful evidence with zero fabricated structured match flags.

### 2. Component Implementation Status & Inventory
- **CandidateRetrievalController (IMPLEMENTED / HARDENED)**: REST ingress endpoint protected by `JwtAuthGuard`. Retrieves authoritative server-side facts via `CitizenQueryService.getStructuredFactsByUserId(userId)`, assigns strictly to `authoritativeCitizenFacts`, places caller-supplied values strictly in `retrievalHints`, and rejects cross-citizen impersonation with HTTP 403 `ForbiddenException`.
- **CandidateRetrievalService (IMPLEMENTED / HARDENED)**: Central orchestrator executing true hybrid candidate retrieval. Integrates PII regex scrubbing on `searchQuery`, independent structured and vector candidate discovery, candidate version union and deduplication, version and document identity defense, evidence disaggregation with truthful match flags, 3-tier deterministic ranking (`score DESC`, `docNumber ASC`, `versionId ASC`), and truthful status handling (`SUCCESS`, `PARTIAL_RESULTS`, `NO_RESULTS`, `RETRIEVAL_FAILURE`).
- **SemanticAlignmentService (IMPLEMENTED / HARDENED)**: Projects authoritative facts and retrieval hints onto canonical attributes via frozen `SemanticRegistryService` with explicit provenance tracking (`factProvenance: 'AUTHORITATIVE' | 'EXPLORATORY_HINT'`). Purges high-risk PII at ingress; scrubs values entering `unresolvedInputs`; separates canonical facts from exploratory hints; derives `ageYears` from `DEMOGRAPHICS.DOB`.
- **PrismaCandidateRetrievalRepository (IMPLEMENTED / BASELINE)**: Executes deterministic database queries (`orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]`) filtering by `status: 'ACTIVE'`, `isCurrent: true`. Applies `relevantAttributeCodes` overlap check and chunk metadata filtering. Implements `findCandidatePolicyVersionsByIds` for resolving active current policy versions discovered independently by vector search.
- **DeterministicVectorTestAdapter (IMPLEMENTED / TEST ADAPTER)**: Computes mathematically exact cosine similarity in `[-1.0, 1.0]`, derives normalized relevance score `(cosine + 1.0) / 2.0`, enforces finite-vector guards, dimension matching, zero-norm safety, and independent corpus search across `ACTIVE_CURRENT_POLICY_VERSIONS`. Explicitly test infrastructure, not a production embedding pipeline.
- **IVectorSearchProvider (IMPLEMENTED / CONTRACT)**: Decoupled interface abstraction for vector similarity search supporting independent `corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS'`.
- **Dependency Injection Architecture (IMPLEMENTED)**: Unified providers using NestJS `useExisting` referencing token-based providers; imported `CitizenModule` for authoritative fact lookup. 0 duplicate singletons.

### 3. Core Architectural & Security Boundaries
1. **Zero Eligibility Coupling (Firewall Invariant)**: S12B candidate retrieval contains 0 rule evaluation logic. `RuleEngineService.evaluateRule` is verified by test spy to never be invoked during candidate retrieval. Candidate results contain zero eligibility decision booleans (`passedRules`, `failedRules`, `isEligible` strictly omitted).
2. **Deterministic Relevance Scoring**: `retrievalScore` is a relevance ranking metric in `[0.0, 1.0]`. It is never an eligibility confidence or approval probability.
3. **Truthful Observability**: Match flags (`departmentMatch`, `ministryMatch`, `stateMatch`, etc.) return `undefined` when no filter was requested (never `true` merely because metadata exists), and are strictly `undefined` for vector-only candidates. `appliedFilters` strictly reports criteria actually executed.
4. **Version Safety**: Service fusion layer defensively asserts `vm.versionId === raw.policyVersionId && vm.documentId === raw.policyId && raw.isCurrent === true`. Cross-version or cross-document chunk contamination is rejected.
5. **PII Defense**: Aadhaar (12-digit), PAN (10-char alphanumeric), Bank Accounts (9–18 digits), and phone numbers are scrubbed via deterministic regex from `searchQuery`, hints, and unresolved input tracking before embedding query generation, logging, or warning emission.
6. **Security Grounding**: Strict Zod validation rejects undeclared request properties; authentication, authorization, semantic validation and server-side fact resolution enforce the broader security boundary.

### 4. Tracked Integration Gaps
- **GAP-RET-001 (Production Vector Persistence - DEFERRED)**: PostgreSQL has `pgvector 0.8.1` enabled, but neither `policy_chunks` nor `embedding_preparations` contains a vector column in the current schema. S12B defines the complete `IVectorSearchProvider` abstraction tested via `DeterministicVectorTestAdapter`. Production vector persistence is intentionally deferred.
- **GAP-RET-002 (ContextEngine Upstream Integration - DEFERRED TO S13)**: Upstream candidate filtering before deep rule evaluation in `ContextEngineService` is reserved for Sprint 13. S12B establishes and tests the authoritative-context extraction boundary that S13 MUST consume. ContextEngine/eligibility integration remains deferred to S13.
- **GAP-RET-003 (Production-Scale Structured Retrieval Query Optimization - DEFERRED)**: Pushing chunk metadata (`state`, `ministry`, `beneficiaryCategory`) and rule attribute filtering into database indexes/materialized views rather than in-memory working-set evaluation (`take: limit * 3`) is tracked for future production scaling. `totalCandidates` represents qualifying working-set count prior to truncation.

### 5. Verified Test Evidence (ACTUAL FINAL CURRENT COUNTS)
- **Total Backend Suite**: 83 test files passed, 472 tests passed, 0 failures, 0 regressions.
- **S12B Candidate Retrieval & Semantic Domain Suite**: 7 test files passed, 153 tests passed, 0 failures:
  - `candidate-retrieval.spec.ts`: 7 tests
  - `h1-trust-boundary-adversarial.spec.ts`: 15 tests
  - `h2-true-hybrid-adversarial.spec.ts`: 22 tests
  - `remediation-adversarial.spec.ts`: 57 tests
  - `retrieval-adversarial.spec.ts`: 13 tests
  - `semantic-alignment.spec.ts`: 10 tests
  - *Candidate Retrieval Subtotal: 124 tests across 6 files*
  - `semantic-contract.spec.ts`: 29 tests across 1 file
  - *S12B Domain Total: 153 tests across 7 files*
- **TypeScript**: 0 errors (`npx tsc --noEmit`).
- **Prisma**: 1 migration found, schema up to date, 0 drift.


