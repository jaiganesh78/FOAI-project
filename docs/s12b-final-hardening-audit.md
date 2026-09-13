# S12B — Final Hardening & Architectural Closure Audit Report

**Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Workspace:** `D:\FOAI_PROJECT`  
**Current Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Final Audit Verdict:** **GREEN — S12B CLOSED & CERTIFIED FOR SPRINT 13**  

---

## 1. Executive Summary

Sprint 12B (**Candidate Retrieval & Semantic Alignment Foundation**) has undergone a comprehensive, multi-layered final hardening, security closure, and architectural reconciliation pass.

Every critical boundary — from semantic authority and citizen fact trust to PII screening, vector mathematics, version isolation, evidence truthfulness, and scalability honesty — has been audited against running code, database queries, and adversarial test executions.

### Non-Negotiable Invariants Upheld:
1. **"S12B does NOT determine eligibility."** Candidate retrieval evaluates relevance and applicability; it never computes boolean eligibility, evaluates rule conditions (e.g. income or land thresholds), or calls `RuleEngineService`.
2. **"Vector similarity is retrieval relevance only."** Vector similarity contributes strictly as a relevance ranking signal; it can never prove eligibility, create citizen facts, or override structured constraints.
3. **"SemanticRegistryService remains the V1 semantic authority."** The frozen V1 Semantic Core remains 100% UNCHANGED and UNTOUCHED (0 modifications to canonical attributes, controlled values, or alias rules).

All 16 previous audit findings (R1–R16), all 6 hardening findings (F1–F6), and both architectural issues (H1 Citizen Fact Trust Boundary, H2 True Hybrid Retrieval) are fully resolved and adversarially verified. With 153 candidate retrieval & semantic domain tests (124 candidate retrieval tests across 6 files + 29 semantic contract tests across 1 file), 472 total backend tests across 83 test files, 0 TypeScript errors, and 0 Prisma drift, Sprint 12B is formally certified **CLOSED (GREEN)**.

---

## 2. Previous R1–R16 Findings Status Verification

| ID | Finding Description | Status | Evidence |
|:---:|---|:---:|---|
| **R1** | `relevantAttributeCodes` not actually used in Prisma repository | **RESOLVED** | Enforced in `prisma-candidate-retrieval.repository.ts`. Tests D.24–D.26 verify structured attribute intersection without threshold evaluation. |
| **R2** | Ministry filter claimed but not implemented | **RESOLVED** | Extracted from `chunk.metadata.ministry` and filtered; reported truthfully in `appliedFilters`. Tests D.18, D.19. |
| **R3** | PII sanitization omitted on `searchQuery` | **RESOLVED** | Deterministic regex scrubs Aadhaar, PAN, and Bank Accounts into `[REDACTED_IDENTIFIER]`. Tests B.11–B.14. |
| **R4** | Client `citizenContext` not authoritative | **RESOLVED** | `CandidateRetrievalController` fetches authoritative facts from `CitizenQueryService`; cross-citizen spoofing throws HTTP 403. Tests C.15–C.17, C.56. |
| **R5** | Semantic authority escape hatch (`key.includes('.')`) | **RESOLVED** | Completely removed from `SemanticAlignmentService`. Unregistered dotted keys fail closed to `unresolvedInputs`. Tests A.1–A.3. |
| **R6** | Retrieval metadata vs canonical facts blurred | **RESOLVED** | `state`, `beneficiaryCategory`, and `age` separated into retrieval context; `ageYears` derived from `DEMOGRAPHICS.DOB`. Tests A.7, D.20, D.22. |
| **R7** | Deterministic vector adapter mathematics & silent clamping | **RESOLVED** | Returns exact cosine in `[-1.0, 1.0]`, normalized score `(cosine + 1)/2`, finite number guards. Tests E.27–E.34. |
| **R8** | Evidence chunk double-counting | **RESOLVED** | Disaggregated into `totalChunkCount`, `vectorMatchedChunkCount`, `uniqueMatchedChunkCount` via Set deduplication. Tests G.38, G.41. |
| **R9** | `departmentMatch` evaluated as metadata existence | **RESOLVED** | Returns `undefined` when unrequested; `true` on match; `false` on mismatch. Tests G.39, G.40. |
| **R10** | Prisma repository scalability | **RESOLVED (BASELINE)** | Pushed status and deterministic ordering to DB; documented baseline vs production gap `GAP-RET-003`. Tests D.18–D.26. |
| **R11** | Unstable `take(limit * 3)` without deterministic ordering | **RESOLVED** | Enforced `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]` in Prisma repository. Tests J.49, J.50. |
| **R12** | `totalCandidates` semantics | **RESOLVED** | `totalCandidates` reports pre-truncation candidate count; `returnedCandidates` reports `candidates.length`. Tests J.50, J.51. |
| **R13** | Dead code `findChunksByVersionIds` | **RESOLVED** | Purged method from repository and interface; clean compilation. |
| **R14** | Duplicate module provider registration | **RESOLVED** | Clean `useExisting` provider aliasing in `CandidateRetrievalModule`. |
| **R15** | RuleEngine non-invocation test was weak | **RESOLVED** | Test H.42 uses `vi.spyOn(RuleEngineService.prototype, 'evaluateRule')` proving 0 calls. |
| **R16** | Cross-version vector fusion defense was weak | **RESOLVED** | Defensive version validation in service: `match.versionId === raw.policyVersionId`. Tests F.35–F.37. |

---

## 3. New Findings Discovered in Final Hardening Audit (F1–F6)

| ID | Finding | Severity | Root Cause | Remediation | Evidence |
|:---:|---|:---:|---|---|---|
| **F1** | Raw PII values could leak into `unresolvedInputs` and `warnings` | **HIGH** | `SemanticAlignmentService` pushed `${key}:${String(rawValue)}` into `unresolvedInputs` without value scrubbing if key name wasn't in `SENSITIVE_FACT_KEYS`. | Implemented `sanitizeValueForAudit()` in `SemanticAlignmentService` redacting Aadhaar/PAN/Bank digits. | Test 53 in `remediation-adversarial.spec.ts` passes. |
| **F2** | Ambiguity in client exploratory facts vs authoritative facts | **MEDIUM** | Client facts not in server profile could be merged into retrieval context without clear architectural classification. | Documented explicit boundary: client facts not in server profile act solely as *exploratory retrieval hints*; can never become authoritative facts or affect S13 eligibility. | Tests 15, 17, 56, 57 pass. |
| **F3** | Missing 3rd tier tie-breaker in candidate sorting | **LOW** | Sorting only compared `retrievalScore` and `documentNumber`, omitting `policyVersionId`. | Added `a.policyVersionId.localeCompare(b.policyVersionId)` as 3rd deterministic tie-breaker. | Test 54 in `remediation-adversarial.spec.ts` passes. |
| **F4** | In-memory candidate working set vs full corpus scalability | **MEDIUM** | Repository fetches bounded window (`take: limit * 3`) and filters in JS; `totalCandidates` reflects working set, not unbounded `COUNT(*)`. | Formally registered `GAP-RET-003` for production-scale query pushdown and indexed views. Documented working-set semantics honestly. | Baseline documented; `GAP-RET-003` tracked. |
| **F5** | Unsubstantiated "cryptographic provenance" terminology | **LOW** | Docs claimed "cryptographically sound provenance" when implementation provides deterministic IDs without HMAC/Ed25519. | Reconciled terminology to "deterministic policy-version provenance / traceability". | Docs updated. |
| **F6** | Bank account regex false-positive classification | **LOW** | `\b\d{9,18}\b` matches any 9–18 digit sequence. Described as exact bank detection. | Reclassified honestly as a **conservative long-digit identifier redaction filter**. | Test 55 passes; docs reconciled. |

---

## 4. Security & Privacy Audit

1. **Ingress PII Screening**:
   - High-risk identifier keys (`aadhaar`, `pan`, `bankaccount`, `voterid`, `rationcard`) are purged at ingress by `SemanticAlignmentService`.
   - Values written to `unresolvedInputs` and `ambiguousInputs` are scrubbed via `sanitizeValueForAudit()`: Aadhaar (`\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{12}\b`), PAN (`\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b`), and Bank Accounts (`\b\d{9,18}\b`) are replaced with `[REDACTED_IDENTIFIER]`.
2. **Search Query Privacy**:
   - `searchQuery` is scrubbed deterministically via `CandidateRetrievalService.sanitizeSearchQuery()` before reaching `IEmbeddingProvider`.
   - Audit warning emitted: `'1 sensitive input removed from search query'`.
3. **Observability Privacy**:
   - Zero raw PII tokens are printed to NestJS / Pino logs, warnings, execution traces, or retrieval evidence.
   - PII purge events are logged with masked keys: `[REDACTED_KEY]`.

---

## 5. Semantic Authority & Frozen Core Audit

1. **Zero-AI Semantic Boundary**:
   - No LLM, embeddings, vector similarity, or probabilistic inference is permitted to canonicalize citizen facts or create aliases.
   - `SemanticRegistryService` remains the sole V1 semantic authority.
2. **Escape Hatch Removal Verified**:
   - Any unknown, unregistered, lowercase, or fabricated dotted key (e.g. `FAKE.NEW_ATTRIBUTE`, `agriculture.land_area`) fails closed into `unresolvedInputs`.
   - Canonical facts are populated strictly through registry resolution.
3. **Categorical Disambiguation**:
   - `COMMUNITY.SOCIAL_CATEGORY` (caste: `GENERAL`, `OBC`, `SC`, `ST`) is strictly isolated from `ECONOMIC.EWS_STATUS` (boolean).
   - `POLICY_CLASSIFICATION` (`SCHEME`, `GUIDELINE`, `ACT`) is strictly isolated from `BENEFICIARY_CATEGORY` (`FARMER`, `STUDENT`).

---

## 6. Citizen Fact Trust Boundary Audit

1. **Server-Side Authoritative Resolution**:
   - `CandidateRetrievalController` extracts authenticated caller identity from `@CurrentUser()`.
   - Authoritative facts are retrieved server-side via `CitizenQueryService.getStructuredFactsByUserId(userId)`.
   - Server-side facts override client-supplied facts for any identical key.
2. **Cross-Citizen Access Defense**:
   - If client passes `citizenContext.userId` differing from JWT claims, HTTP 403 `ForbiddenException` is thrown.
3. **Exploratory Client Facts Boundary**:
   - Client-provided facts not present in the server profile serve strictly as *exploratory retrieval hints* for candidate policy discovery.
   - Client-supplied facts can NEVER mutate the citizen profile database and can NEVER be consumed by Sprint 13 for eligibility evaluation.

---

## 7. Structured Retrieval & Applicability Audit

1. **Prisma Query Filters**:
   - Evaluates `status: PolicyLifecycleStatus.ACTIVE` and `deletedAt: null`.
   - Current version filtering (`isCurrent: true`).
   - Deterministic multi-column ordering: `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]`.
2. **Applicability Filtering**:
   - State applicability: National policies (`state: null`, `'all'`, `'national'`) match universally; state-specific policies require exact state match.
   - Beneficiary category: Case-insensitive match against chunk metadata.
   - Ministry & Department: Case-insensitive matching against chunk metadata.
   - Semantic attribute overlap: Evaluated via `criteria.relevantAttributeCodes`. Requires at least 1 overlapping attribute when both policy and citizen define attributes. Condition thresholds are NEVER evaluated.

---

## 8. Vector Retrieval & Test Adapter Audit

1. **Vector Test Adapter Mathematics**:
   - `DeterministicVectorTestAdapter` calculates exact mathematical cosine similarity in `[-1.0, 1.0]`.
   - Derived normalized relevance score: `normalizedScore = (rawCosine + 1.0) / 2.0` in `[0.0, 1.0]`.
   - Finite guards: Rejects non-finite inputs (`NaN`, `Infinity`, `-Infinity`), zero-norm vectors, and dimension mismatches by returning similarity `0.0`.
2. **Production Reality & Deferred pgvector**:
   - Production PostgreSQL vector persistence and worker-based embedding generation are deferred (`GAP-RET-001`).
   - S12B provides the decoupled `IVectorSearchProvider` interface contract.

---

## 9. Version Isolation & Safety Audit

1. **Exact PolicyVersion Binding**:
   - Every candidate is uniquely identified by `policyVersionId` and `policyVersionNumber`.
2. **Defensive Fusion Verification**:
   - `CandidateRetrievalService` validates `match.versionId === raw.policyVersionId && match.documentId === raw.policyId`.
   - Cross-version vector matches are discarded defensively, preventing chunk contamination across versions.

---

## 10. Evidence & Provenance Audit

1. **Chunk Counting Deduplication**:
   - Disaggregated fields in `RetrievalEvidence`:
     - `totalChunkCount`: Total chunks in policy version.
     - `vectorMatchedChunkCount`: Array length of vector matches.
     - `uniqueMatchedChunkCount`: Set cardinality of unique matched chunk IDs.
     - `matchedChunkCount`: Equal to `uniqueMatchedChunkCount` (zero double-counting).
2. **Truthful Match Indicators**:
   - `departmentMatch`, `ministryMatch`, `stateMatch`, `beneficiaryCategoryMatch`, and `policyClassificationMatch` return `undefined` when no filter constraint was requested (never `true` merely because metadata exists).
3. **Deterministic Provenance**:
   - Every candidate returns `{ documentId, versionId, sourceId, retrievedAt }`.

---

## 11. Scalability & Performance Audit

1. **Prisma Working Set Retrieval**:
   - Query uses bounded `take: limit * 3` with `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]`.
   - Documented as an acceptable V1 development baseline.
2. **Production Scalability Gap (`GAP-RET-003`)**:
   - Production-scale query pushdown (moving chunk metadata and rule attribute filtering into database indexes, materialized views, or dedicated metadata tables) is tracked as `GAP-RET-003`.

---

## 12. Dependency Injection Graph Audit

1. **Token Aliasing**:
   - `CandidateRetrievalModule` uses NestJS `useExisting` aliases pointing concrete class tokens to injection tokens.
   - Prevents duplicate instantiation of `SemanticAlignmentService`, `PrismaCandidateRetrievalRepository`, or `DeterministicVectorTestAdapter`.
2. **Module Graph**:
   - Cleanly imports `AuthModule`, `PrismaModule`, `SemanticModule`, `AIProviderModule`, and `CitizenModule`.

---

## 13. Test Quality & Verification Proofs

- **Real Execution Spy**: Test 42 uses `vi.spyOn(RuleEngineService.prototype, 'evaluateRule')` to prove 0 calls during retrieval.
- **Defensive Vector Injection**: Test 36 actively injects a vector match with `versionId: 'ver-pm-kisan-v2'` into a candidate for `ver-pm-kisan-v1` and proves rejection.
- **Negative Cosine Proof**: Test 29 proves exact negative cosine `-1.0` and normalized score `0.0`.
- **PII Scrubbing Proof**: Tests 11–14, 53, 55 prove complete absence of raw Aadhaar and PAN numbers across queries, warnings, and results.
- **Spoofing Proof**: Test 15 proves cross-citizen spoofing throws HTTP 403; Test 56 proves server facts override client facts.

---

## 14. Verification Summary Table

| Check | Command Executed | Exit Code | Result | Status |
|---|---|:---:|---|:---:|
| **Candidate Retrieval Suite** | `npx vitest run test/unit/candidate-retrieval` | 0 | 6 test files passed, 124 tests passed, 0 failed | **PASS** |
| **Semantic Contract Suite** | `npx vitest run test/unit/semantic` | 0 | 1 test file passed, 29 tests passed, 0 failed | **PASS** |
| **Full Backend Vitest Suite** | `npx vitest run` | 0 | 83 test files passed, 472 tests passed, 0 failed | **PASS** |
| **TypeScript Compilation** | `npx tsc --noEmit` | 0 | 0 errors, clean stdout and stderr | **PASS** |
| **Prisma Migration Status** | `npx prisma migrate status` | 0 | 1 migration found, schema up to date, 0 drift | **PASS** |

---

## 15. Tracked Future Integration Gaps

1. **`GAP-RET-001` (Production Vector Persistence & Ingestion)**:
   - **Status**: DEFERRED to production infrastructure sprint.
   - **Description**: S12B provides the `IVectorSearchProvider` abstraction tested via `DeterministicVectorTestAdapter`. Production pgvector schema columns and worker ingestion pipeline remain deferred.
   - **Does it block S12B closure?**: NO.
2. **`GAP-RET-002` (ContextEngine Upstream Integration)**:
   - **Status**: DEFERRED to Sprint 13.
   - **Description**: Connecting candidate retrieval as the upstream narrowing stage before deep rule evaluation in `ContextEngineService` is owned by Sprint 13.
   - **Does it block S12B closure?**: NO.
3. **`GAP-RET-003` (Production-Scale Structured Retrieval Query Optimization)**:
   - **Status**: DEFERRED to future optimization sprint.
   - **Description**: Pushing chunk metadata and rule attribute filtering into database indexes/views rather than in-memory working set filtering.
   - **Does it block S12B closure?**: NO.

---

## 16. Final Architectural Closure Certification

Sprint 12B is formally **CLOSED**.  
All requirements, security invariants, mathematical models, evidence rules, and test suites are verified and certified. The platform is ready for Sprint 13.
