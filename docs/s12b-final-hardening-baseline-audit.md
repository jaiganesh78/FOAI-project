# S12B — Final Hardening Baseline Audit Report (Phase 0)

**Audit Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Workspace:** `D:\FOAI_PROJECT`  
**Current Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Audit Purpose:** Pre-Hardening Forensic Baseline & Defect Identification  

---

## 1. Executive Summary

A comprehensive forensic audit was conducted across `apps/backend`, `packages/shared`, `docs/`, and `Architecture.md` to establish the baseline for the final hardening and integrity closure of Sprint 12B.

All core non-negotiable invariants were audited against actual code, running tests, database schema, and documentation. While the previous surgical remediation resolved findings R1–R16, this forensic pass has identified subtle security, contract, observability, and scalability limitations that must be addressed before S12B can be formally declared CLOSED.

---

## 2. Current Implementation Inventory

| Component / File | Class / Entity | Current Role & Implementation State |
|---|---|---|
| `apps/backend/src/modules/candidate-retrieval/controllers/candidate-retrieval.controller.ts` | `CandidateRetrievalController` | Authenticated ingress controller. Enforces `JwtAuthGuard`, queries `CitizenQueryService.getStructuredFactsByUserId(userId)`, and validates request with Zod. |
| `apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts` | `CandidateRetrievalService` | High-level orchestrator. Coordinates alignment, structured querying, vector search, fusion, score bounding, and truthful status determination. |
| `apps/backend/src/modules/candidate-retrieval/services/semantic-alignment.service.ts` | `SemanticAlignmentService` | Semantic adapter over frozen `SemanticRegistryService`. Maps raw facts to canonical codes, strips known PII keys, and identifies unresolved/ambiguous inputs. |
| `apps/backend/src/modules/candidate-retrieval/repositories/prisma-candidate-retrieval.repository.ts` | `PrismaCandidateRetrievalRepository` | Prisma repository querying `PolicyDocument` and `PolicyVersion`. Filters by state, category, ministry, department, and attribute overlap. |
| `apps/backend/src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter.ts` | `DeterministicVectorTestAdapter` | In-memory test adapter computing mathematical cosine similarity over fixture vectors. Handles non-finite values and zero norms safely. |
| `apps/backend/src/modules/candidate-retrieval/adapters/vector-search.adapter.interface.ts` | `IVectorSearchProvider` | Abstract interface contract decoupling vector retrieval from concrete providers. |
| `apps/backend/src/modules/candidate-retrieval/candidate-retrieval.module.ts` | `CandidateRetrievalModule` | NestJS module registering providers with clean token aliasing (`useExisting`) and importing `CitizenModule`. |
| `packages/shared/src/interfaces/candidate-retrieval.interface.ts` | TypeScript Interfaces | Domain contracts for requests, results, candidates, evidence, provenance, and repository criteria. |
| `packages/shared/src/dtos/candidate-retrieval.dtos.ts` | DTO Interfaces | Typed transfer objects matching Zod schemas. |
| `packages/shared/src/schemas/candidate-retrieval.schema.ts` | Zod Schemas | Strict input schemas enforcing bounds (`maxCandidates`, `minScore`) and rejecting unknown properties. |

---

## 3. Current System Status Metrics

- **TypeScript Static Verification (`npx tsc --noEmit`)**: 0 errors (Exit code: 0)
- **Prisma Migration Status (`npx prisma migrate status`)**: 1 migration found, database schema is up to date, 0 drift (Exit code: 0)
- **Candidate Retrieval Test Suite**: 82 passed (4 test files)
  - `remediation-adversarial.spec.ts`: 52 passed
  - `retrieval-adversarial.spec.ts`: 13 passed
  - `semantic-alignment.spec.ts`: 10 passed
  - `candidate-retrieval.spec.ts`: 7 passed
- **Semantic Contract Test Suite (`semantic-contract.spec.ts`)**: 29 passed (1 test file)
- **Full Backend Vitest Suite (`vitest run`)**: 430 passed (81 test files, 0 failed, 0 regressions)

---

## 4. Verification of Previous Remediation (R1–R16 Status)

| Finding ID | Scope | Remediated State Verified? | Verification Notes |
|:---:|---|:---:|---|
| **R1** | `relevantAttributeCodes` overlap check | **YES** | Enforced in `PrismaCandidateRetrievalRepository`. Requires >=1 overlapping attribute without checking condition thresholds. |
| **R2** | Ministry filter implementation | **YES** | Ministry extracted from `chunk.metadata.ministry` and filtered; truthfully reported in `appliedFilters`. |
| **R3** | PII sanitization in `searchQuery` | **YES** | Deterministic regex replaces Aadhaar, PAN, and Bank Account numbers with `[REDACTED_IDENTIFIER]`. |
| **R4** | Authoritative citizen fact lookup | **YES** | Server-side lookup via `CitizenQueryService`; cross-citizen spoofing throws HTTP 403 `ForbiddenException`. |
| **R5** | Removal of `key.includes('.')` escape hatch | **YES** | Removed; unregistered dotted keys fail closed into `unresolvedInputs`. |
| **R6** | Distinction between canonical facts and retrieval metadata | **YES** | `state`, `beneficiaryCategory`, and `age` treated as retrieval context, not canonical attributes. |
| **R7** | Vector mathematics & finite guards | **YES** | Cosine similarity in `[-1.0, 1.0]`, normalized score `(cosine + 1)/2`, guards against NaN/Infinity/zero-norm. |
| **R8** | Evidence chunk counting deduplication | **YES** | `uniqueMatchedChunkCount` computed via Set deduplication; no double-counting. |
| **R9** | Truthful match flags | **YES** | Flags return `undefined` when no filter constraint was requested (never `true` merely because metadata exists). |
| **R10** | Scalability baseline documentation | **YES** | Prisma queries use deterministic multi-column ordering. |
| **R11** | Deterministic ordering | **YES** | `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]` enforced in Prisma repository. |
| **R12** | `totalCandidates` vs `returnedCandidates` | **YES** | `totalCandidates` records pre-truncation candidate count; `returnedCandidates` records `candidates.length`. |
| **R13** | Dead code removal (`findChunksByVersionIds`) | **YES** | Method purged from repository and interface. |
| **R14** | Module duplicate provider cleanup | **YES** | Clean `useExisting` provider registration in `CandidateRetrievalModule`. |
| **R15** | RuleEngine non-invocation spy test | **YES** | Verified via `vi.spyOn(RuleEngineService.prototype, 'evaluateRule')`. |
| **R16** | Cross-version isolation defense test | **YES** | Fusion layer verifies `match.versionId === raw.policyVersionId && match.documentId === raw.policyId`. |

---

## 5. New Forensic Findings & Gaps Identified in Final Audit

### Finding F1 (Security / Observability): Raw Value Leakage in `warnings` and `unresolvedInputs`
- **Location**: `apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts` (lines 66, 69) and `semantic-alignment.service.ts` (lines 141, 143, 145, 169)
- **Defect**:
  When a citizen supplies an unresolved fact (e.g. `rawFacts = { citizen_id: "123456789012" }`), `SemanticAlignmentService` pushes `${key}:${String(rawValue)}` into `unresolvedInputs`.
  Then `CandidateRetrievalService` pushes:
  `warnings.push('Unresolved context-required inputs preserved without inference: ' + alignedSignals.unresolvedInputs.join(', '))`.
  If the key is not in `SENSITIVE_FACT_KEYS`, raw sensitive numbers (e.g. Aadhaar or PAN in custom/unregistered fields) are pushed directly into `warnings` and returned in the HTTP response envelope!
- **Required Fix**:
  1. In `SemanticAlignmentService`, sanitize the string value written to `unresolvedInputs` and `ambiguousInputs` by redacting Aadhaar, PAN, and long-digit numbers.
  2. In `CandidateRetrievalService`, format `warnings` to reference ONLY the attribute keys (e.g. `unresolvedInputs.map(u => u.split(':')[0])`), never the raw values.

### Finding F2 (Contract / Trust Boundary): Ambiguity in Client-Supplied vs Authoritative Facts
- **Location**: `apps/backend/src/modules/candidate-retrieval/controllers/candidate-retrieval.controller.ts` (lines 61–73)
- **Defect**:
  `effectiveFacts = { ...validRequest.citizenContext.facts, ...authoritativeFacts }`.
  While authoritative facts from the database take strict precedence over client-supplied facts for the same key, a client can still inject an *additional* fact that does not exist in their database profile (e.g. if their profile has no income, they can supply `annualIncome: 1000`).
  This fact can enter `alignedSignals.canonicalAttributesPresent` and influence structured attribute overlap retrieval.
- **Required Fix & Clarification**:
  1. Explicitly document this path: Client-provided facts not present on the server profile act as *exploratory retrieval hints* for candidate discovery only.
  2. Document the hard architectural firewall: Client-supplied facts can NEVER become authoritative citizen facts and can NEVER influence downstream S13 eligibility evaluation (which independently queries authoritative facts from the database).
  3. Ensure documentation does not falsely claim "client facts can never enter retrieval".

### Finding F3 (Ranking / Determinism): 3-Key Tie-Breaking Completeness
- **Location**: `apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts` (lines 293–298)
- **Defect**:
  The sorting comparator breaks ties on `retrievalScore` using `a.documentNumber.localeCompare(b.documentNumber)`.
  If two candidate versions have the same score and same document number (or identical values), sorting order between versions could theoretically rely on unstable V8 engine array order.
- **Required Fix**:
  Add `a.policyVersionId.localeCompare(b.policyVersionId)` as the explicit 3rd deterministic tie-breaker in `candidate-retrieval.service.ts`.

### Finding F4 (Performance / Scalability): Working Set vs Full Database Corpus Honesty
- **Location**: `apps/backend/src/modules/candidate-retrieval/repositories/prisma-candidate-retrieval.repository.ts` (lines 63, 197)
- **Defect**:
  The repository fetches `take: limit * 3` documents and breaks when `results.length >= limit`.
  Therefore, `totalCandidates` in `CandidateRetrievalResult` reflects the number of matching candidates within the retrieved working set window before `maxCandidates` truncation; it does NOT execute an unbounded `COUNT(*)` over the entire database.
- **Required Fix**:
  1. Clarify the exact semantic definition of `totalCandidates` in the contract and implementation docs.
  2. Formally register **`GAP-RET-003` (Production-Scale Structured Candidate Retrieval Optimization)** to track pushing chunk metadata and rule attribute filtering into database indexes/views rather than in-memory working sets.

### Finding F5 (Security / Terminology): Cryptographic Claims in Documentation
- **Location**: `docs/s12b-candidate-retrieval-contract.md`, `docs/s12b-candidate-retrieval-implementation-audit.md`
- **Defect**:
  Documentation refers to "cryptographically sound provenance" and "strict .strict() schema prevents prototype pollution".
  In reality, provenance consists of deterministic IDs (`documentId`, `versionId`, `sourceId`, `retrievedAt`) without cryptographic signatures (e.g. HMAC or Ed25519).
  Zod `.strict()` rejects undeclared schema properties, which mitigates unexpected field injection, but is only one layer in a defense-in-depth model.
- **Required Fix**:
  Reconcile terminology to "deterministic policy-version provenance / traceability" and accurately describe Zod strict validation within the layered security model.

### Finding F6 (Security / Classification): Long-Digit Identifier Regex Classification
- **Location**: `apps/backend/src/modules/candidate-retrieval/services/candidate-retrieval.service.ts` (lines 362–366)
- **Defect**:
  Bank account regex `\b\d{9,18}\b` matches any contiguous 9–18 digit number.
- **Required Fix**:
  Document this honestly as a **conservative long-digit identifier redaction filter**, not an exact bank-account format detector, to maintain complete transparency about potential false positives on long reference numbers.

---

## 6. Exact Remediation Plan

1. **Remediate PII Leakage in Observability (Finding F1)**:
   - In `SemanticAlignmentService`, add `sanitizeValueForAudit()` to redact Aadhaar/PAN/Bank Account patterns from values entering `unresolvedInputs` and `ambiguousInputs`.
   - In `CandidateRetrievalService`, update warning formatting to output only unresolved attribute keys, never raw values.
2. **Reinforce Deterministic 3-Key Tie-Breaker (Finding F3)**:
   - In `CandidateRetrievalService`, add `a.policyVersionId.localeCompare(b.policyVersionId)` as the final tie-breaker.
3. **Register `GAP-RET-003` for Production Scalability (Finding F4)**:
   - Document `GAP-RET-003` in `Architecture.md` and contract documentation.
4. **Reconcile Documentation & Terminology (Findings F2, F5, F6)**:
   - Update `Architecture.md`, `s12b-candidate-retrieval-contract.md`, `s12b-candidate-retrieval-implementation-audit.md`, and author `s12b-final-hardening-test-matrix.md`, `s12b-final-hardening-audit.md`, and `s12b-final-verification.md`.
5. **Add Hardening Adversarial Tests**:
   - Add tests verifying:
     - PII in unregistered facts is redacted from `unresolvedInputs` and `warnings`.
     - Warning strings only emit attribute keys.
     - Multi-key tie-breaking determinism with identical document numbers.
     - Exploratory client fact boundary and non-propagation to eligibility.
