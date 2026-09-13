# S12B — Candidate Retrieval & Semantic Alignment Implementation Audit

**Date:** 2026-09-13  
**Auditor:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Scope:** Deep Architectural & Code Verification of S12B Final Hardening (H1 + H2) Implementation in `apps/backend` and `packages/shared`  
**Status:** **GREEN — AUDITED & FULLY VERIFIED**  

---

## 1. Architectural Overview & Component Inventory

Sprint 12B delivers the candidate retrieval subsystem for GPIOS. It answers:
> **"Which policy versions are relevant candidates for downstream evaluation?"** — NEVER *"Is this citizen eligible?"*.

The implementation consists of 13 major components strictly reflecting the final H1 (Citizen Fact Trust Boundary) and H2 (True Hybrid Retrieval) architectures:

1. **`CandidateRetrievalController`**: REST ingress controller enforcing JWT authentication, cross-citizen ownership defense (403), server-side authoritative fact loading via `CitizenQueryService`, and strict isolation of caller inputs as `retrievalHints`.
2. **`CandidateRetrievalService`**: High-level retrieval orchestrator executing true hybrid candidate retrieval (independent structured retrieval and independent vector retrieval across the active policy corpus, metadata resolution via `findCandidatePolicyVersionsByIds`, version identity validation, union, deduplication by `PolicyVersionId`, and deterministic tie-breaking).
3. **`SemanticAlignmentService`**: Dual-loop semantic adapter projecting authoritative facts and retrieval hints onto the Frozen V1 Semantic Core with explicit fact provenance (`AUTHORITATIVE` vs `EXPLORATORY_HINT`).
4. **`PrismaCandidateRetrievalRepository`**: Database repository performing deterministic structured policy version queries and vector candidate metadata resolution (`findCandidatePolicyVersionsByIds`) enforcing `status = ACTIVE`, `isCurrent = true`, and `deletedAt = null`.
5. **`DeterministicVectorTestAdapter`**: Mathematically exact, bounded cosine similarity test adapter for independent vector discovery across `ACTIVE_CURRENT_POLICY_VERSIONS`.
6. **`IVectorSearchProvider`**: Decoupled interface contract for vector similarity search supporting independent `corpusScope = 'ACTIVE_CURRENT_POLICY_VERSIONS'`.
7. **`IEmbeddingProvider` Usage**: Abstraction for converting sanitized text into dense embeddings.
8. **DTO / Zod Schema Validation**: Strict input validation (`.strict()`). Strict Zod validation rejects undeclared request properties; authentication, authorization, semantic validation and server-side fact resolution enforce the broader security boundary.
9. **Ranking & Fusion Logic**: Deterministic scoring (`0.6 * struct + 0.4 * vector` for HYBRID, pure score for single channel) and 3-tier deterministic tie-breaking (`retrievalScore DESC`, `documentNumber ASC`, `policyVersionId ASC`).
10. **Provenance Generation**: Deterministic policy-version provenance and traceability (`documentId`, `versionId`, `sourceId`, `retrievedAt`).
11. **Retrieval Status Handling**: Truthful categorization (`SUCCESS`, `PARTIAL_RESULTS`, `NO_RESULTS`, `RETRIEVAL_FAILURE`).
12. **Privacy Filtering & PII Policy**: Regex scrubbing of Aadhaar, PAN, Bank Accounts, Phone, and Mobile numbers from queries, hints, and unresolved tracking with audit warnings.
13. **Authenticated Identity & Fact Authority Boundary (H1)**: Server-side profile resolution and structural trust separation between authoritative facts and retrieval hints, including the S13 architectural firewall (`extractS13AuthoritativeContext`).

---

## 2. Deep Component Audits

### Component 1: `CandidateRetrievalController` (H1 Trust Separation)
- **Purpose**: Exposes the candidate retrieval REST API, enforces authentication, verifies caller identity, loads authoritative server facts, and strictly segregates client retrieval hints.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/controllers/candidate-retrieval.controller.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/controllers/candidate-retrieval.controller.ts)
- **Class**: `CandidateRetrievalController`
- **Injected Dependencies**:
  - `@Inject(CANDIDATE_RETRIEVAL_SERVICE) private readonly retrievalService: CandidateRetrievalService`
  - `@Optional() @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService?: CitizenQueryService`
- **Input**:
  - `user`: Authenticated JWT payload (`{ userId: string; ... }`) via `@CurrentUser()`.
  - `body`: Raw payload validated by `candidateRetrievalRequestSchema.safeParse(body)`.
- **Validation**:
  - `JwtAuthGuard` ensures a valid, unexpired Bearer token.
  - Zod schema validates structure, bounds, and rejects undeclared properties (`.strict()`).
  - Cross-identity check: If `validRequest.citizenContext.userId` is provided and does not match `user.userId`, throws `ForbiddenException('Cross-citizen access forbidden: user cannot retrieve candidates for another citizen')`.
- **Internal Algorithm (H1 Trust Separation)**:
  1. Receive authenticated `user.userId`.
  2. Query `citizenQueryService.getStructuredFactsByUserId(effectiveUserId)` to load authoritative citizen facts from PostgreSQL into `authoritativeCitizenFacts`.
  3. Client-provided values (via `retrievalHints` or legacy `facts`) are strictly mapped to `retrievalHints`. They NEVER enter `authoritativeCitizenFacts`.
  4. Construct authoritative `CandidateRetrievalRequest` containing `{ userId, authoritativeCitizenFacts, retrievalHints }`.
  5. Invoke `retrievalService.retrieveCandidates(effectiveRequest)`.
  6. Return response in standard GPIOS JSON envelope: `{ success: true, data: result, timestamp: ... }`.
- **Output**: Standard API envelope containing `CandidateRetrievalResult`.
- **Error Behavior**:
  - 401 Unauthorized if JWT is missing/invalid.
  - 403 Forbidden if client attempts cross-citizen spoofing.
  - 400 Bad Request on schema violation.
- **Security Behavior**: Eliminates client-controlled authoritative fact injection: caller-provided values are structurally isolated as retrieval hints and cannot populate authoritative canonical facts or cross the S13 authoritative-context boundary. Server-side facts are authoritative.
- **Tests**: `h1-trust-boundary-adversarial.spec.ts` (H1-01, H1-02), `remediation-adversarial.spec.ts` (Tests 15, 16, 17).

---

### Component 2: `CandidateRetrievalService` (H2 True Hybrid Candidate Retrieval)
- **Purpose**: Central orchestration service managing the end-to-end true hybrid candidate retrieval lifecycle.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts)
- **Class**: `CandidateRetrievalService`
- **Injected Dependencies**:
  - `@Inject(CANDIDATE_RETRIEVAL_REPOSITORY) private readonly repository: ICandidateRetrievalRepository`
  - `@Inject(SEMANTIC_ALIGNMENT_SERVICE) private readonly alignmentService: SemanticAlignmentService`
  - `@Inject(VECTOR_SEARCH_PROVIDER) private readonly vectorProvider: IVectorSearchProvider`
  - `private readonly embeddingProvider: IEmbeddingProvider`
- **Step-by-Step Algorithm (`retrieveCandidates`)**:
  - **Step 1 [Trace Generation]**: Generate unique `executionTraceId = crypto.randomUUID()` and record `startTime = Date.now()`.
  - **Step 2 [Mode & Constraint Resolution]**: Resolve `searchMode = request.mode ?? 'STRUCTURED_ONLY'`. Extract `constraints = request.constraints ?? {}`. Default `maxCandidates = clamp(constraints.maxCandidates ?? 10, 1, 50)`, `minScore = clamp(constraints.minScore ?? 0.1, 0.0, 1.0)`.
  - **Step 3 [Semantic Alignment & Ingress Scrubbing (H1)]**: Pass `request.citizenContext` (containing `authoritativeCitizenFacts` and `retrievalHints`) to `alignmentService.alignCitizenFacts()`. Receive `AlignedCitizenSignals` with authoritative `canonicalFacts` and non-authoritative `exploratoryHints`.
  - **Step 4 [PII Scrubbing on Free-Text Query]**: If `request.searchQuery` is provided, invoke `sanitizeSearchQuery(request.searchQuery)`. Scrub Aadhaar, PAN, and Bank Account numbers with regex, replacing with `[REDACTED_IDENTIFIER]`. If redacted, append `'1 sensitive input removed from search query'` to `warnings`.
  - **Step 5 [Structured Channel Execution]**: Construct `StructuredRetrievalCriteria` using:
    - `state`: constraints.state ?? alignedSignals.state
    - `beneficiaryCategory`: constraints.beneficiaryCategory ?? alignedSignals.beneficiaryCategory
    - `policyClassification`: constraints.policyClassification
    - `ministry`: constraints.ministry
    - `department`: constraints.department
    - `relevantAttributeCodes`: alignedSignals.canonicalAttributesPresent
    - `limit`: maxCandidates * 2
    Execute `repository.findCandidatePolicyVersions(criteria)`. If repository throws, catch error, log redacted trace, and immediately return status `RETRIEVAL_FAILURE` with empty candidates.
  - **Step 6 [Independent Vector Channel Execution (H2)]**:
    - If `searchMode === 'HYBRID'`, check `vectorProvider.isAvailable()`.
    - Generate query embedding via `embeddingProvider.generateEmbedding(sanitizedQuery)`.
    - Query `vectorProvider.searchSimilarChunks(embedding, { corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS', maxResults: maxCandidates * 3, minScore: 0.0 })`.
    - **CRITICAL INVARIANT**: Vector search is executed across the active policy corpus with ZERO candidate ID restrictions (`versionFilter: undefined`, `allowedVersionScope: undefined`). Vector search is NOT a post-filter or reranker; it is an independent candidate discovery channel.
    - If vector provider throws, append warning `'Vector search provider degraded; returning structured candidates only'` and mark `degraded = true`.
  - **Step 7 [Missing Metadata Resolution for Vector Discoveries (H2)]**:
    - Identify vector-matched policy versions not returned by structured search: `missingVersionIds = vectorVersionIds.filter(id => !structuredVersionMap.has(id))`.
    - Query `repository.findCandidatePolicyVersionsByIds(missingVersionIds)` to fetch complete policy and version metadata.
    - Validate each vector match: `vm.documentId === raw.policyId && raw.isCurrent === true`. Discard any mismatched or superseded versions defensively.
  - **Step 8 [Candidate Union & Deduplication by PolicyVersionId (H2)]**:
    - Union candidate versions from both channels. Deduplicate strictly by exact `PolicyVersionId`.
    - Assign truthful `retrievalMethod`:
      - Matched by both structured and vector: `retrievalMethod = 'HYBRID'`.
      - Matched by structured channel only: `retrievalMethod = 'STRUCTURED'`.
      - Discovered by vector channel only: `retrievalMethod = 'VECTOR'`.
  - **Step 9 [Score Fusion & Truthful Evidence Construction (H2)]**:
    - Compute `structuredScore = 0.5 + 0.1 * overlapRatio` for structured candidates.
    - Compute `normalizedVectorScore = (rawCosine + 1.0) / 2.0` for vector matches.
    - If `HYBRID` (both channels): `retrievalScore = 0.6 * structuredScore + 0.4 * normalizedVectorScore`.
    - If `STRUCTURED` (structured only): `retrievalScore = structuredScore`, `vectorScore = undefined`.
    - If `VECTOR` (vector only): `retrievalScore = normalizedVectorScore`, `vectorScore = normalizedVectorScore`.
    - **Truthful Evidence Contract**: For vector-only candidates, structured match flags (`stateMatch`, `beneficiaryCategoryMatch`, `departmentMatch`, `ministryMatch`, `policyClassificationMatch`) are explicitly set to `undefined`. ZERO structured match flags are fabricated.
  - **Step 10 [Relevance Threshold Filtering]**: Filter out candidates where `retrievalScore < minScore`.
  - **Step 11 [Deterministic 3-Tier Sorting]**: Sort candidates using:
    1. `retrievalScore` descending
    2. `documentNumber` ascending
    3. `policyVersionId` ascending
  - **Step 12 [Candidate Bounding & Working-Set Semantics]**:
    - Record `totalCandidates = qualifyingCandidates.length` (qualifying working-set count prior to truncation, per GAP-RET-003).
    - Truncate: `boundedCandidates = qualifyingCandidates.slice(0, maxCandidates)`.
    - Record `returnedCandidates = boundedCandidates.length`.
  - **Step 13 [Truthful Filter Observability]**: Build `appliedFilters` recording strictly the filters actually evaluated by repository and service.
  - **Step 14 [Status Finalization & Return]**:
    - If `candidates.length === 0`: return status `NO_RESULTS`.
    - Else if `degraded`: return status `PARTIAL_RESULTS`.
    - Else: return status `SUCCESS`.
- **Output**: `CandidateRetrievalResult`.
- **Error Behavior**: Database exceptions return `RETRIEVAL_FAILURE` without leaking stack traces or raw PII.
- **Security Behavior**: PII is scrubbed before embeddings; execution trace is anonymized; version bounds strictly guarded.
- **Tests**: `h2-true-hybrid-adversarial.spec.ts` (all 22 tests, including mandatory proof test), `remediation-adversarial.spec.ts` (all 57 tests).

---

### Component 3: `SemanticAlignmentService` (H1 Trust Separation)
- **Purpose**: Dual-loop semantic adapter mapping authoritative facts and exploratory hints onto the Frozen V1 Semantic Core (`SemanticRegistryService`) without inference.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/services/semantic-alignment.service.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/services/semantic-alignment.service.ts)
- **Class**: `SemanticAlignmentService`
- **Injected Dependencies**:
  - `private readonly semanticRegistry: SemanticRegistryService`
- **Input**:
  - `input`: `CandidateRetrievalCitizenContext | Record<string, unknown>`
- **Internal Algorithm (H1 Dual-Loop Separation)**:
  1. Separate input into `authoritativeCitizenFacts` and `retrievalHints`.
  2. Ingress PII Scrubbing: Remove sensitive identifiers (`aadhaar`, `pan`, `bankAccount`, `phone`, `mobile`, `email`) from both dictionaries.
  3. **Authoritative Loop**:
     - For each key in `authoritativeCitizenFacts`:
       - Resolve attribute code via `semanticRegistry.resolveAttribute(key)`.
       - If resolved: resolve canonical value; store in `canonicalFacts`; record in `canonicalAttributesPresent`; tag `factProvenance[code] = 'AUTHORITATIVE'`.
       - Derive typed projection fields (`state`, `socialCategory`, `ewsStatus`, `beneficiaryCategory`, `primaryOccupation`, `annualIncomeInr`, `landHoldingHectares`, `gender`). Derive `ageYears` from `DEMOGRAPHICS.DOB`.
       - If unresolved: record in `unresolvedInputs` (with value redacted).
  4. **Exploratory Hints Loop**:
     - For each key in `retrievalHints`:
       - Resolve attribute code via `semanticRegistry.resolveAttribute(key)`.
       - If already present in `canonicalFacts`: IGNORE hint (authoritative fact retains absolute precedence).
       - If resolved but absent from server profile: resolve canonical value; store strictly in `exploratoryHints`; record in `exploratoryAttributeCodes`; tag `factProvenance[code] = 'EXPLORATORY_HINT'`.
       - Derive exploratory projection fields (`exploratoryState`, `exploratoryBeneficiaryCategory`, `exploratoryPrimaryOccupation`, `exploratoryAgeYears`).
       - If unresolved: fail closed into `unresolvedInputs` (with value redacted).
  5. Return `AlignedCitizenSignals`.
- **Output**: `AlignedCitizenSignals`.
- **Invariants Enforced**:
  - `canonicalFacts` contains authoritative facts ONLY.
  - Exploratory hints NEVER enter `canonicalFacts` or `canonicalAttributesPresent`.
  - Registered client-only facts are strictly exploratory.
  - Unknown facts fail closed without escape hatches.
- **Tests**: `h1-trust-boundary-adversarial.spec.ts` (H1-03 through H1-12, H1-14, H1-15), `semantic-alignment.spec.ts` (all 10 tests).

---

### Component 4: `PrismaCandidateRetrievalRepository`
- **Purpose**: Executes structured database queries against PostgreSQL and resolves candidate policy versions discovered via vector search.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/repositories/prisma-candidate-retrieval.repository.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/repositories/prisma-candidate-retrieval.repository.ts)
- **Class**: `PrismaCandidateRetrievalRepository`
- **Injected Dependencies**:
  - `private readonly prisma: PrismaService`
- **Methods**:
  1. `findStructuredCandidates(criteria: StructuredRetrievalCriteria): Promise<RawCandidatePolicy[]>`:
     - Queries `policyDocument.findMany` with `status = 'ACTIVE'`, `deletedAt = null`, `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]`.
     - Loads current version (`isCurrent: true`), rules, conditions, and chunks with metadata.
     - Evaluates state applicability, beneficiary category, ministry, classification, and attribute overlap.
  2. `findCandidatePolicyVersionsByIds(versionIds: string[]): Promise<RawCandidatePolicy[]>`:
     - Queries active, non-deleted documents whose versions match `versionIds` and have `isCurrent: true`.
     - Extracts version metadata, referenced attributes, chunk counts, and sample chunk titles.
- **Output**: Array of `RawCandidatePolicy`.
- **Tests**: `candidate-retrieval.spec.ts`, `h2-true-hybrid-adversarial.spec.ts`, `remediation-adversarial.spec.ts`.

---

### Component 5: `DeterministicVectorTestAdapter` (H2 Independent Corpus Search)
- **Purpose**: Test adapter implementing exact mathematical cosine similarity over test vectors across the active corpus.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter.ts)
- **Class**: `DeterministicVectorTestAdapter` implements `IVectorSearchProvider`
- **Algorithm**:
  - Accepts `queryEmbedding` and `options?: VectorSearchOptions`.
  - When `options.corpusScope === 'ACTIVE_CURRENT_POLICY_VERSIONS'` (or default), searches the entire registered active fixture vector pool independently.
  - Applies `allowedVersionScope` only when explicitly specified.
  - Computes exact cosine similarity: $\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$.
  - Guarded against `NaN`, `Infinity`, dimension mismatches, and zero vectors.
- **Output**: `RawVectorMatch[]` with exact cosine in `[-1.0, 1.0]`.
- **Tests**: `h2-true-hybrid-adversarial.spec.ts` (H2-03, H2-12), `remediation-adversarial.spec.ts` (Tests 27–34).

---

### Component 6: `IVectorSearchProvider` Contract
- **Purpose**: Decoupled interface contract for vector search engines supporting independent corpus scope.
- **File Path**: [`apps/backend/src/modules/candidate-retrieval/adapters/vector-search.adapter.interface.ts`](file:///D:/FOAI_PROJECT/apps/backend/src/modules/candidate-retrieval/adapters/vector-search.adapter.interface.ts)
- **Contract**:
  ```typescript
  export type VectorCorpusScope = 'ACTIVE_CURRENT_POLICY_VERSIONS' | 'ALL';

  export interface VectorSearchOptions {
    limit?: number;
    minScore?: number;
    corpusScope?: VectorCorpusScope;
    allowedVersionScope?: string[];
  }

  export interface IVectorSearchProvider {
    searchSimilarChunks(
      queryEmbedding: number[],
      options?: VectorSearchOptions,
    ): Promise<RawVectorMatch[]>;
    isAvailable(): Promise<boolean>;
  }
  ```

---

### Component 7: `IEmbeddingProvider` Usage
- **Purpose**: Abstraction for generating dense vector embeddings from text strings.
- **Security Control**: Only receives sanitized text from `CandidateRetrievalService.sanitizeSearchQuery()`. Raw PII is scrubbed before transmission.
- **Tests**: `h2-true-hybrid-adversarial.spec.ts` (H2-20).

---

### Component 8: DTO & Zod Schema Validation
- **Files**:
  - [`packages/shared/src/dtos/candidate-retrieval.dtos.ts`](file:///D:/FOAI_PROJECT/packages/shared/src/dtos/candidate-retrieval.dtos.ts)
  - [`packages/shared/src/schemas/candidate-retrieval.schema.ts`](file:///D:/FOAI_PROJECT/packages/shared/src/schemas/candidate-retrieval.schema.ts)
- **Security Control**: Strict Zod validation rejects undeclared request properties; authentication, authorization, semantic validation and server-side fact resolution enforce the broader security boundary.
- **Enforcement**: `.strict()` is enforced on `candidateRetrievalRequestSchema`, `candidateRetrievalCitizenContextSchema`, and `candidateRetrievalConstraintsSchema`.

---

### Component 9: Ranking & Fusion Logic (H2)
- **Score Fusion**:
  - For candidates matched by both channels (`HYBRID`):
    $$\text{Relevance Score} = 0.6 \times \text{Structured Score} + 0.4 \times \left(\frac{\text{Raw Cosine} + 1.0}{2.0}\right)$$
  - For structured-only candidates (`STRUCTURED`): $\text{Relevance Score} = \text{Structured Score}$.
  - For vector-only candidates (`VECTOR`): $\text{Relevance Score} = \frac{\text{Raw Cosine} + 1.0}{2.0}$.
- **Deterministic 3-Tier Tie-Breaking**:
  1. `retrievalScore` descending
  2. `documentNumber` ascending
  3. `policyVersionId` ascending
- **Tests**: `h2-true-hybrid-adversarial.spec.ts` (H2-12, H2-13), `remediation-adversarial.spec.ts` (Tests 49, 54).

---

### Component 10: Provenance Generation
- **Contract**: Every `CandidatePolicy` returns deterministic policy-version provenance and traceability:
  `{ documentId, versionId, sourceId, retrievedAt: new Date().toISOString() }`.
- **Zero Fake Claims**: Provenance provides exact database identifiers and retrieval timestamps; no claims of cryptographic signing (HMAC/Ed25519) are made.

---

### Component 11: Retrieval Status Handling
- **Status Truthfulness**:
  - `SUCCESS`: Clean run with matching candidates.
  - `PARTIAL_RESULTS`: Vector provider failed or degraded, structured results returned.
  - `NO_RESULTS`: 0 candidates matched constraints.
  - `RETRIEVAL_FAILURE`: Database exception caught.
- **Tests**: `h2-true-hybrid-adversarial.spec.ts` (H2-17, H2-18, H2-19), `remediation-adversarial.spec.ts` (Tests 46, 47, 48).

---

### Component 12: Privacy Filtering & PII Policy
- **Regex Detectors**:
  - Aadhaar: `\b\d{4}\s?\d{4}\s?\d{4}\b`
  - PAN: `\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b`
  - Bank Account / Long Digit: `\b\d{9,18}\b`
  - Phone / Mobile: `\b\d{10}\b`
- **Logging & Audit Rule**: Raw values are never logged; replaced with `[REDACTED_IDENTIFIER]`.

---

### Component 13: Authenticated Identity & Fact Authority Boundary (H1)
- **Architecture**:
  - External callers identify via JWT Bearer token.
  - Fact lookup is performed server-side via `CitizenQueryService`.
  - Client cannot override authoritative facts.
  - Cross-user retrieval is rejected with HTTP 403 `ForbiddenException`.
  - **S13 Firewall (`extractS13AuthoritativeContext`)**: S12B establishes and tests the authoritative-context extraction boundary that S13 MUST consume. ContextEngine/eligibility integration remains deferred to S13.
- **Tests**: `h1-trust-boundary-adversarial.spec.ts` (H1-01, H1-02, H1-13).

---

## 3. Verification Summary

| Suite / File | Tests | Passed | Failed | Status |
|---|:---:|:---:|:---:|:---:|
| `test/unit/candidate-retrieval/candidate-retrieval.spec.ts` | 7 | 7 | 0 | **PASS** |
| `test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts` | 15 | 15 | 0 | **PASS** |
| `test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts` | 22 | 22 | 0 | **PASS** |
| `test/unit/candidate-retrieval/remediation-adversarial.spec.ts` | 57 | 57 | 0 | **PASS** |
| `test/unit/candidate-retrieval/retrieval-adversarial.spec.ts` | 13 | 13 | 0 | **PASS** |
| `test/unit/candidate-retrieval/semantic-alignment.spec.ts` | 10 | 10 | 0 | **PASS** |
| **Candidate Retrieval Subtotal** | **124** | **124** | **0** | **PASS** |
| `test/unit/semantic/semantic-contract.spec.ts` | 29 | 29 | 0 | **PASS** |
| **Total S12B Domain Tests** | **153** | **153** | **0** | **PASS** |
| **Full Backend Regression Suite (83 files)** | **472** | **472** | **0** | **PASS** |
| **TypeScript (`npx tsc --noEmit`)** | 0 errors | 0 errors | 0 | **PASS** |
| **Prisma Status (`npx prisma migrate status`)** | 1 migration | Up to date | 0 drift | **PASS** |
