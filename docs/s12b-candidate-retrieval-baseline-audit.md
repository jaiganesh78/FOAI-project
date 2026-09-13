# S12B — Candidate Retrieval & Semantic Alignment Baseline Audit
**Document ID:** `DOC-S12B-AUDIT-001`  
**Phase:** Step 0 — Forensic Audit & Baseline Discovery  
**Status:** COMPLETE  
**Date:** September 12, 2026  
**Auditor / Reviewer:** Principal Architect + Senior Backend Engineer + Adversarial Auditor  
**Repository:** `D:\FOAI_PROJECT`  
**Governing Rule:** Evidence beats documentation. Never modify documentation to conceal an implementation gap.

---

## 1. Executive Summary

This audit establishes the ground reality of the GPIOS codebase regarding policy retrieval, vector search, embedding infrastructure, and semantic alignment prior to the execution of Sprint 12B (Candidate Retrieval & Semantic Alignment Foundation).

The audit confirms:
1. **Frozen Semantic Contract:** The V1 Semantic Layer (`packages/shared/src/interfaces/semantic.interface.ts`, `SemanticRegistryService`) is frozen, deterministic, and tested (29/29 semantic tests pass). It acts as an authoritative upstream dependency and must not be altered.
2. **Current Policy Evaluation Bottleneck:** In `ContextEngineService` (`apps/backend/src/modules/eligibility/services/context-engine.service.ts`), policy evaluation currently invokes `knowledgeQueryService.getActivePolicies()`, retrieving the entire active policy corpus with zero candidate filtering or semantic alignment.
3. **Existing Vector Infrastructure:** PostgreSQL has `pgvector 0.8.1` enabled (`CREATE EXTENSION IF NOT EXISTS "vector"` in migration `20260812034959_sprint12_remediation_fields`). `schema.prisma` declares `extensions = [pgvector(map: "vector")]` and defines `EmbeddingPreparation` (with `status: PENDING`, `embeddingVersion`, `modelIdentifier`, `checksum`). `IEmbeddingProvider` interface and a `GeminiLLMAdapter` scaffold exist.
4. **Vector Column Gap:** No raw vector column (`vector(1536)`) has been migrated into `policy_chunks` or `embedding_preparations` in PostgreSQL. Policy chunks are stored with `embeddingPrep` in `PENDING` status. No production embedding generation pipeline is executing.
5. **No Migration Needed:** Per Phase 6 and Phase 23 of the S12B specification, missing production embeddings must be documented as an integration gap rather than fabricated with fake data or unnecessary schema migrations. Candidate retrieval must provide an abstraction over structured filtering, lexical signals, and vector search with a deterministic test adapter.

---

## 2. Forensic Answers to Baseline Questions (A through J)

### A. What vector infrastructure already exists?
- **Database Engine:** PostgreSQL 16/18 with `pgvector 0.8.1` extension enabled in `gpios_db` (`CREATE EXTENSION IF NOT EXISTS "vector";` in `apps/backend/prisma/migrations/20260812034959_sprint12_remediation_fields/migration.sql:2`).
- **Prisma Configuration:** `apps/backend/prisma/schema.prisma:9` contains `extensions = [pgvector(map: "vector")]`.
- **Core Abstraction:** `IEmbeddingProvider` interface in `apps/backend/src/core/ai-provider/embedding-provider.interface.ts`.
- **Scaffold Adapter:** `GeminiLLMAdapter` in `apps/backend/src/core/ai-provider/gemini-llm.adapter.ts` implements `IEmbeddingProvider.generateEmbedding` (returning 1536-dimensional mock floats).
- **DI Token:** `EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER')` in `apps/backend/src/core/tokens/injection-tokens.ts:7`.

### B. What tables contain embeddings?
- **Current Database Reality:** **Zero tables currently contain an active vector column.**
- In `schema.prisma:854-866`, the `embedding_preparations` table tracks chunk embedding lifecycle:
  ```prisma
  model EmbeddingPreparation {
    id               String          @id @default(uuid())
    chunkId          String          @unique
    status           EmbeddingStatus @default(PENDING)
    embeddingVersion String          @default("v1")
    modelIdentifier  String          @default("text-embedding-3-small")
    checksum         String
    updatedAt        DateTime        @updatedAt
    chunk            PolicyChunk     @relation(fields: [chunkId], references: [id], onDelete: Cascade)
  }
  ```
- Neither `policy_chunks` nor `embedding_preparations` has an `Unsupported("vector(1536)")` column defined in Prisma.

### C. What entity is embedded?
- The architectural unit of chunking is `PolicyChunk` (`policy_chunks` table).
- Each chunk has an associated `EmbeddingPreparation` record created during document ingestion (`PrismaPolicyChunkRepository.createChunk`).
- Chunks have stable content-addressable identifiers (`stableChunkId`), paragraph indices, and line lineage.

### D. Are policy chunks embedded?
- **Runtime Reality:** **No.** All chunks ingested by `DocumentProcessingPipeline` remain in `status: PENDING`. No background worker or pipeline currently generates embeddings or stores vector floats in PostgreSQL.

### E. Are policy-level embeddings available?
- **No.** Policies are only embedded at the chunk level. There is no policy-level embedding model or table.

### F. What metadata accompanies embeddings?
- **Chunk Metadata (`policy_chunk_metadata`):**
  - `ministry`, `department`, `schemeName`, `state`, `district`, `beneficiaryCategory`, `normalizedAmount`, `extractionConfidence`, `extractionMethod`, `extractedBy`, `sourceLocation`.
- **Chunk Structural Data (`policy_chunks`):**
  - `documentId`, `versionId`, `stableChunkId`, `chunkIndex`, `sectionTitle`, `pageNumber`, `paragraphIndex`, `content`, `checksum`.
- **Policy Version Data (`policy_versions`):**
  - `documentId`, `versionNumber`, `fingerprintHash`, `effectiveDate`, `expiryDate`, `isCurrent`.
- **Policy Document Data (`policy_documents`):**
  - `sourceId`, `documentNumber`, `title`, `classification` (`SCHEME`, `GOVERNMENT_ORDER`, etc.), `status` (`PolicyLifecycleStatus`: `ACTIVE`, etc.).
- **Rule Conditions (`rule_conditions`):**
  - `attributeKey`, `operator`, `expectedValue`.

### G. What filtering capabilities already exist?
- `PolicyDocumentRepository`: `findByStatus(PolicyLifecycleStatus)` (e.g. `ACTIVE`).
- `PolicyVersionRepository`: `findCurrentByDocumentId(documentId)`, `findByFingerprint(hash)`.
- `PolicyChunkRepository`: `findByVersionId(versionId)`, `findByStableChunkId(stableChunkId)`.
- `FactUsageIndexService`: In-memory index of `attributeKey -> Set<ruleCode>`.
- **Gap:** No composite query repository exists to filter policies by citizen state, category, department, or canonical attributes.

### H. What repositories/services already exist?
- `PrismaPolicyDocumentRepository` (`apps/backend/src/modules/knowledge/repositories/prisma-policy-document.repository.ts`)
- `PrismaPolicyVersionRepository` (`apps/backend/src/modules/knowledge/repositories/prisma-policy-version.repository.ts`)
- `PrismaPolicyChunkRepository` (`apps/backend/src/modules/knowledge/repositories/prisma-policy-chunk.repository.ts`)
- `PrismaPolicyRuleRepository` (`apps/backend/src/modules/eligibility/repositories/prisma-policy-rule.repository.ts`)
- `KnowledgeQueryService` (`apps/backend/src/modules/knowledge/services/knowledge-query.service.ts`)
- `ContextEngineService` (`apps/backend/src/modules/eligibility/services/context-engine.service.ts`)
- `SemanticRegistryService` (`apps/backend/src/core/semantic/semantic-registry.service.ts`)

### I. What candidate-search functionality already exists?
- **None.** In `ContextEngineService.buildContext(userId)`:
  ```typescript
  const citizenFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
  const activePolicies = await this.knowledgeQueryService.getActivePolicies();
  ```
  Every eligibility run evaluates the entire active policy set against every active rule. There is zero pre-filtering, zero candidate scoring, and zero candidate ranking.

### J. What is genuinely missing?
1. **Candidate Retrieval Domain Contract:** Request, candidate policy representation, retrieval result, evidence, and provenance types (DDD/Clean Architecture).
2. **Semantic Alignment Service:** Bridges raw citizen facts to canonical semantic attributes using `SemanticRegistryService`, extracting deterministic filters (e.g., residence state, occupation, land holding) without guessing or unvalidated inference.
3. **Candidate Retrieval Repository / Query Engine:** Implements structured filtering, lexical/attribute matching, and vector retrieval abstraction.
4. **Hybrid Retrieval & Candidate Fusion:** Deduplicates chunk-level matches into stable `PolicyVersion` candidates with retrieval score, matched signals, and provenance.
5. **Traceability & Explainability:** Provides retrieval-level explanations ("Why was this policy retrieved?") distinctly separated from S13 eligibility explanations ("Why is this citizen eligible?").
6. **Adversarial Safety Guards:** Explicit tests and code proving vector similarity never proves eligibility, ambiguous phrases are never converted to canonical facts, and sensitive attributes (Aadhaar, bank account) are never embedded.
7. **Failure Mode Handling:** Distinguishes `NO_RESULTS`, `PARTIAL_RESULTS`, and `RETRIEVAL_FAILURE`.

---

## 3. Inspected Files List

- `Architecture.md`
- `docs/v1-semantic-contract.md`
- `docs/v1-semantic-freeze-integrity-final-verification.md`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20260812034959_sprint12_remediation_fields/migration.sql`
- `apps/backend/src/core/tokens/injection-tokens.ts`
- `apps/backend/src/core/ai-provider/embedding-provider.interface.ts`
- `apps/backend/src/core/ai-provider/gemini-llm.adapter.ts`
- `apps/backend/src/core/semantic/semantic-registry.service.ts`
- `apps/backend/src/modules/knowledge/knowledge.module.ts`
- `apps/backend/src/modules/knowledge/services/knowledge-query.service.ts`
- `apps/backend/src/modules/knowledge/services/document-processing.pipeline.ts`
- `apps/backend/src/modules/knowledge/repositories/prisma-policy-chunk.repository.ts`
- `apps/backend/src/modules/knowledge/repositories/prisma-policy-document.repository.ts`
- `apps/backend/src/modules/knowledge/repositories/prisma-policy-version.repository.ts`
- `apps/backend/src/modules/eligibility/services/eligibility-evaluation.orchestrator.ts`
- `apps/backend/src/modules/eligibility/services/context-engine.service.ts`
- `apps/backend/src/modules/eligibility/services/fact-usage-index.service.ts`
- `apps/backend/src/modules/recommendation/services/recommendation-generation.service.ts`

---

## 4. Proposed Implementation Boundary for S12B

To satisfy Sprint 12B without introducing architectural churn or invalid schema migrations:
1. **Shared Contracts (`packages/shared`):**
   - Define Candidate Retrieval Request, Candidate Policy, Candidate Retrieval Result, and Retrieval Evidence DTOs/interfaces.
2. **Semantic Alignment Engine (`apps/backend/src/modules/candidate-retrieval/services/semantic-alignment.service.ts`):**
   - Ingests raw citizen facts.
   - Leverages frozen `SemanticRegistryService` to resolve canonical attributes and exact aliases.
   - Extracts safe structured query criteria (state, category, income range, land area).
   - Flags and isolates ambiguous/context-required inputs (`farmer`, `business worker`) without manufacturing facts.
   - Strips sensitive identifiers (`IDENTITY.RESIDENCE_STATE` is safe, but Aadhaar / bank account are explicitly excluded).
3. **Candidate Retrieval Repository (`apps/backend/src/modules/candidate-retrieval/repositories/`):**
   - Interface `ICandidateRetrievalRepository`.
   - Implementation `PrismaCandidateRetrievalRepository`:
     - Structured search: joins `policy_documents`, `policy_versions`, `policy_chunk_metadata`, and `rule_conditions`.
     - Vector search abstraction: interfaces `IEmbeddingProvider` and executes similarity queries against available vector stores / deterministic test adapters.
4. **Candidate Retrieval Orchestrator (`apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts`):**
   - Orchestrates semantic alignment -> structured filtering -> vector retrieval -> candidate fusion & deduplication.
   - Guarantees stable `policyId`, `policyVersionId`, `versionNumber`, and retrieval evidence.
5. **Observability & Traceability:**
   - Structured logging with correlation IDs and safe telemetry (zero PII/sensitive facts).
6. **Adversarial & Unit Test Suite:**
   - 100% executable tests verifying all boundary conditions and invariants.

---

## 5. Explicit "DO NOT IMPLEMENT" List (Out of Scope for S12B)

1. **DO NOT** modify or expand the frozen V1 Semantic Layer (`CanonicalSemanticAttribute`, `SemanticRegistryService`, etc.).
2. **DO NOT** implement S13 Policy Reasoning or eligibility rules.
3. **DO NOT** allow vector similarity to prove or satisfy an eligibility condition.
4. **DO NOT** create a database migration for vector storage when production embeddings are not yet generated.
5. **DO NOT** insert fake random embeddings into the production database.
6. **DO NOT** introduce a second vector database (e.g. Pinecone, Qdrant, Milvus, Weaviate).
7. **DO NOT** invent contextual semantic mappings (e.g., turning `farmer` into `CULTIVATOR` or `small farmer` into a land size).
8. **DO NOT** build conversational AI, policy copilot, or citizen chatbot interfaces.
9. **DO NOT** allow candidate retrieval to mutate citizen facts, policy documents, or rule versions.
