# S12B — Candidate Retrieval & Semantic Alignment Remediation Audit Report

**Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Adversarial Auditor  
**Project:** GPIOS / FOAI Platform (`D:\FOAI_PROJECT`)  
**Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Final Audit Verdict:** **GREEN — S12B Remediation Verified**

---

## 1. Executive Summary

Following an initial audit that rendered an **AMBER** verdict on Sprint 12B due to 16 specific architectural, integrity, and correctness gaps (R1–R16), a comprehensive, surgical remediation was executed. 

### Non-Negotiable Invariants Upheld:
1. **Frozen V1 Semantic Core**: `SemanticRegistryService`, canonical semantic attributes, controlled value vocabularies, units, and alias rules remain **100% UNCHANGED and UNTOUCHED** (0 edits to frozen semantic files).
2. **Retrieval is Not Eligibility**: Retrieval determines policy relevance/applicability candidates; it **never** computes eligibility booleans, checks income/land thresholds, or returns passed/failed rules. `RuleEngineService` is verified to never be invoked.
3. **Relevance-Only Vector Search**: Vector similarity contributes exclusively to relevance ranking and never proves eligibility, creates citizen facts, or overrides structured constraints.
4. **Strict Version Isolation**: `PolicyVersion` identities (`policyVersionId`, `policyVersionNumber`) are preserved end-to-end; chunks or vector matches from differing versions are defensively rejected during fusion.
5. **Zero-AI Semantic Authority**: The frozen `SemanticRegistryService` remains the sole semantic authority; no secondary registry or LLM-based inference was introduced.

All 16 findings were verified against the codebase, confirmed, and systematically remediated. A comprehensive 52-scenario adversarial and regression test suite (`remediation-adversarial.spec.ts`) was authored. All 82 candidate-retrieval tests, 29 semantic contract tests, and 430 total backend test suite tests pass with 0 failures and 0 regressions.

---

## 2. Findings Matrix Summary

| ID | Finding | Confirmed? | Root Cause | Files Remediated | Fix Description | Test Reference | Final Status |
|---|---|---|---|---|---|---|---|
| **R1** | `relevantAttributeCodes` not actually used | Confirmed | `PrismaCandidateRetrievalRepository` omitted `criteria.relevantAttributeCodes` filter | `prisma-candidate-retrieval.repository.ts` | Filter policy candidates requiring at least one overlapping referenced attribute without evaluating rule thresholds | Tests D.24, D.25, D.26 | **RESOLVED** |
| **R2** | Ministry filter claimed but not implemented | Confirmed | Ministry metadata was stored in `PolicyChunk.metadata.ministry` but ignored in repo query | `prisma-candidate-retrieval.repository.ts`, `candidate-retrieval.interface.ts`, `candidate-retrieval.dtos.ts` | Extracted ministry from chunk metadata, filtered by criteria, and reported in `appliedFilters` truthfully | Tests D.18, D.19, G.39 | **RESOLVED** |
| **R3** | PII sanitization does not cover `searchQuery` | Confirmed | Raw `searchQuery` was passed uninspected to embedding provider | `candidate-retrieval.service.ts` | Implemented deterministic regex scrubbing (Aadhaar, PAN, Bank Account) with audit warning and redacted logging | Tests B.11, B.12, B.13, B.14 | **RESOLVED** |
| **R4** | Client-supplied `citizenContext` not authoritative | Confirmed | `CandidateRetrievalController` accepted unverified facts directly from client body | `candidate-retrieval.controller.ts`, `candidate-retrieval.module.ts` | Enforced server-side authoritative lookup via `CitizenQueryService`, verified caller identity, and rejected cross-citizen spoofing | Tests C.15, C.16, C.17 | **RESOLVED** |
| **R5** | Semantic authority escape hatch (`key.includes('.')`) | Confirmed | `SemanticAlignmentService` admitted any dotted key as canonical without registry check | `semantic-alignment.service.ts` | Removed escape hatch completely; unknown or fake dotted keys fail closed to `unresolvedInputs` | Tests A.1, A.2, A.3 | **RESOLVED** |
| **R6** | Retrieval metadata vs canonical citizen facts blurred | Confirmed | `state`, `beneficiaryCategory`, `age` were ad-hoc accepted into canonical facts | `semantic-alignment.service.ts` | Clarified boundary: canonical facts strictly via registry; `state`/`beneficiaryCategory`/`age` handled as retrieval context; derived `ageYears` from `DEMOGRAPHICS.DOB` | Tests A.7, D.20, D.22 | **RESOLVED** |
| **R7** | Deterministic vector adapter mathematics | Confirmed | Silent clamping of negative cosine to 0 without documentation; no finite vector guards | `deterministic-vector-test.adapter.ts` | Returns mathematically exact raw cosine in `[-1.0, 1.0]`, derives normalized relevance score `(cosine + 1) / 2`, guards against NaN/Infinity/zero-norm | Tests E.27–E.34 | **RESOLVED** |
| **R8** | Evidence counting semantically wrong | Confirmed | `matchedChunkCount = raw.chunkCount + vectorMatches.length` caused double counting | `candidate-retrieval.service.ts`, `candidate-retrieval.interface.ts`, `candidate-retrieval.dtos.ts` | Disaggregated chunk evidence into `totalChunkCount`, `vectorMatchedChunkCount`, and `uniqueMatchedChunkCount` via Set deduplication | Tests G.38, G.41 | **RESOLVED** |
| **R9** | `departmentMatch` is not actually a match | Confirmed | Evaluated as `Boolean(raw.department)` indicating mere metadata existence | `candidate-retrieval.service.ts` | Computed against requested constraints; returns `undefined` when no filter was specified, `true` on match, `false` on mismatch | Tests G.39, G.40 | **RESOLVED** |
| **R10** | Prisma repository scalability | Confirmed | Heavy JavaScript-side filtering and unbounded relation graph loading | `prisma-candidate-retrieval.repository.ts` | Pushed status filtering (`ACTIVE`, `currentVersion`) to Prisma; deterministic ordering; documented baseline vs production gap | Tests D.18–D.26 | **RESOLVED** |
| **R11** | `take(limit * 3)` produces unstable results | Confirmed | Non-deterministic DB query without ordering caused random truncation | `prisma-candidate-retrieval.repository.ts` | Added deterministic `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]` to ensure stable candidate selection | Tests J.49, J.50 | **RESOLVED** |
| **R12** | `totalCandidates` semantics | Confirmed | `totalCandidates` was set to truncated count after `maxCandidates` slicing | `candidate-retrieval.service.ts`, `candidate-retrieval.interface.ts`, `candidate-retrieval.dtos.ts` | Explicitly defined `totalCandidates` as pre-truncation candidate count and added `returnedCandidates = candidates.length` | Tests J.50, J.51 | **RESOLVED** |
| **R13** | `findChunksByVersionIds` dead code | Confirmed | Method in `ICandidateRetrievalRepository` was never called by any service | `candidate-retrieval.interface.ts`, `prisma-candidate-retrieval.repository.ts` | Removed dead method from interface and repository implementations | Clean compilation, 0 dead methods | **RESOLVED** |
| **R14** | Module duplicate provider registration | Confirmed | Both injection tokens and class providers were registered separately | `candidate-retrieval.module.ts` | Unified providers using `useExisting` referencing token-based providers; imported `CitizenModule` | Clean DI graph, 0 duplicate singletons | **RESOLVED** |
| **R15** | `RuleEngine` non-invocation test was weak | Confirmed | Test only verified absence of output fields rather than asserting no execution | `remediation-adversarial.spec.ts` | Added `vi.spyOn(RuleEngineService.prototype, 'evaluateRule')` explicitly proving 0 calls during candidate retrieval | Test H.42 | **RESOLVED** |
| **R16** | Version isolation test was too weak | Confirmed | Only tested adapter filter, not defense against malicious cross-version fusion | `candidate-retrieval.service.ts`, `remediation-adversarial.spec.ts` | Service fusion independently verifies `match.versionId === raw.policyVersionId && match.documentId === raw.policyId` | Tests F.35, F.36, F.37 | **RESOLVED** |

---

## 3. Detailed Finding-by-Finding Verification & Remediation

### Finding R1 — `relevantAttributeCodes` Is Not Actually Used
- **Verification**: In `PrismaCandidateRetrievalRepository.findCandidatePolicyVersions`, the input criteria included `relevantAttributeCodes`, but the Prisma query and in-memory candidate mapping completely bypassed this array.
- **Root Cause**: Incomplete structured filter implementation.
- **Remediation**:
  In `PrismaCandidateRetrievalRepository.findCandidatePolicyVersions`:
  ```typescript
  if (criteria.relevantAttributeCodes && criteria.relevantAttributeCodes.length > 0) {
    if (referencedAttributes.length > 0) {
      const hasOverlap = criteria.relevantAttributeCodes.some((code) =>
        referencedAttributes.includes(code),
      );
      if (!hasOverlap) {
        continue; // Skip: policy references specific attributes but none match citizen context
      }
    }
  }
  ```
- **Runtime Behavior Before**: Candidate returned even if citizen facts shared 0 semantic attributes with policy rules.
- **Runtime Behavior After**: Policy requires at least 1 overlapping attribute when both citizen context and policy define attributes. Does NOT evaluate whether values satisfy thresholds (retrieval != eligibility).
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 24, 25, 26.

---

### Finding R2 — Ministry Filter Is Claimed But Not Implemented
- **Verification**: `CandidateRetrievalConstraints.ministry` was received by `CandidateRetrievalService` and passed to `appliedFilters`, but `PrismaCandidateRetrievalRepository` ignored it.
- **Root Cause**: `PolicyDocument` does not have a top-level `ministry` column, but `PolicyChunk.metadata` contains `ministry` as defined in `PolicyChunkMetadata` in `schema.prisma`.
- **Remediation**:
  1. Extracted `policyMinistry` from chunk metadata across active version chunks.
  2. Filtered candidate policies against `criteria.ministry` (case-insensitive substring match).
  3. Recorded `ministry` in `appliedFilters` strictly when applied.
  4. Added `ministryMatch` to `RetrievalEvidence`.
- **Runtime Behavior Before**: Ministry constraint was reported as applied in `appliedFilters` while completely ignored in SQL/memory.
- **Runtime Behavior After**: Exact/case-insensitive matching against chunk metadata ministry. If no match, policy is excluded; `appliedFilters` truthfully reports applied criteria.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 18, 19, 39.

---

### Finding R3 — PII Sanitization Does Not Cover `searchQuery`
- **Verification**: `SemanticAlignmentService.sanitizeCitizenFacts()` scrubbed raw citizen facts, but `CandidateRetrievalRequest.searchQuery` was forwarded directly to `IEmbeddingProvider.generateEmbedding(searchQuery)`.
- **Root Cause**: Query string was treated as arbitrary user text without ingress PII inspection.
- **Remediation**:
  1. Implemented deterministic regex sanitization in `CandidateRetrievalService.sanitizeSearchQuery()`:
     - Aadhaar (12 digits, spaced or continuous): `\b\d{4}\s?\d{4}\s?\d{4}\b`
     - PAN (10 chars, 5 letters + 4 digits + 1 letter): `\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b`
     - Bank Account (9 to 18 contiguous digits): `\b\d{9,18}\b`
  2. Redacted instances replaced with `[REDACTED_IDENTIFIER]`.
  3. Added structured privacy warning: `'1 sensitive input removed from search query'`.
  4. Prevented raw query logging or trace leakage.
- **Runtime Behavior Before**: Citizen could pass raw Aadhaar or PAN in `searchQuery` and have it transmitted to vector embedding provider.
- **Runtime Behavior After**: PII is scrubbed before embedding generation; warning is emitted; embedding provider receives only sanitized tokens.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 11, 12, 13, 14.

---

### Finding R4 — Client-Supplied `citizenContext` Not Authoritative
- **Verification**: `CandidateRetrievalController` accepted `citizenContext.facts` directly from the client JSON payload without checking against backend database.
- **Root Cause**: Controller assumed authenticated caller (`req.user.userId`) was trusted to self-report arbitrary facts for retrieval.
- **Remediation**:
  1. Injected `CitizenQueryService` into `CandidateRetrievalController`.
  2. Looked up authoritative structured facts for `user.userId` via `citizenQueryService.getStructuredFactsByUserId(user.userId)`.
  3. Merged authoritative facts, giving authoritative server-side facts strict precedence over client inputs.
  4. Enforced identity boundary: If client specifies a differing `citizenContext.userId`, threw `ForbiddenException('Cannot perform candidate retrieval for another citizen identity')`.
- **Runtime Behavior Before**: A user could spoof facts (e.g. claim low income to view restricted schemes).
- **Runtime Behavior After**: Authoritative database profile facts are retrieved server-side; cross-user spoofing throws HTTP 403.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 15, 16, 17.

---

### Finding R5 — Semantic Authority Escape Hatch
- **Verification**: `SemanticAlignmentService.ts` contained `else if (key.includes('.')) { canonicalFacts[key] = value; canonicalAttributesPresent.push(key); }`.
- **Root Cause**: Permissive convenience shortcut intended to pass pre-dotted attributes without registry validation.
- **Remediation**:
  Completely removed the dotted-key branch. Any key not recognized by `SemanticRegistryService.resolveAttribute(key)` fails closed into `unresolvedInputs`.
- **Runtime Behavior Before**: Arbitrary keys like `FAKE.NEW_ATTRIBUTE` were accepted into canonical facts.
- **Runtime Behavior After**: Rejected as unresolved; 0 unverified attributes enter `canonicalFacts`.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 1, 2, 3.

---

### Finding R6 — Retrieval Metadata vs Canonical Citizen Facts Blurred
- **Verification**: `state`, `beneficiaryCategory`, and `age` were placed directly into canonical fact projections despite `beneficiaryCategory` not being a canonical attribute.
- **Root Cause**: Semantic fact mapping conflated with retrieval filtering metadata.
- **Remediation**:
  1. Distinct separation between `AlignedCitizenSignals.canonicalFacts` (strictly canonical attributes resolved via registry) and retrieval context fields (`state`, `beneficiaryCategory`).
  2. Derived `ageYears` deterministically from `DEMOGRAPHICS.DOB` if available, or validated integer from retrieval context.
  3. Derived `state` from `IDENTITY.RESIDENCE_STATE` if present.
- **Runtime Behavior Before**: Unregistered attributes were stored in `canonicalFacts`.
- **Runtime Behavior After**: Clear separation between canonical facts and retrieval-only metadata.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 7, 20, 22.

---

### Finding R7 — Deterministic Vector Adapter Mathematics
- **Verification**: `DeterministicVectorTestAdapter` clamped negative cosine similarity to `0.0` with `Math.max(0, cosine)` and lacked validation for non-finite vector components.
- **Root Cause**: Conflating raw cosine similarity with non-negative score ranges.
- **Remediation**:
  1. Implemented strict finite-vector checks (`Number.isFinite`) on all elements.
  2. Enforced dimension matching; threw `BadRequestException` on mismatch.
  3. Guarded against zero-norm vectors (returning `0.0` or error).
  4. Returned mathematically exact raw cosine similarity in `[-1.0, 1.0]`.
  5. Derived normalized relevance score explicitly: `normalizedScore = (rawCosine + 1.0) / 2.0`.
- **Runtime Behavior Before**: Negative similarity silently clamped to zero; NaN vectors resulted in NaN scores.
- **Runtime Behavior After**: Mathematically exact, guarded, and normalized relevance scoring.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 27–34.

---

### Finding R8 — Evidence Counting Semantically Wrong
- **Verification**: `matchedChunkCount = raw.chunkCount + vectorMatches.length` added structured candidate total chunks to vector match chunks, double-counting chunks.
- **Root Cause**: Naive addition of structured chunk count and vector match array length.
- **Remediation**:
  Updated `RetrievalEvidence` in interfaces and service:
  ```typescript
  const uniqueChunkIds = new Set<string>();
  // Vector matches
  for (const vm of vMatches) uniqueChunkIds.add(vm.chunkId);
  
  retrievalEvidence: {
    totalChunkCount: raw.chunkCount,
    vectorMatchedChunkCount: vMatches.length,
    uniqueMatchedChunkCount: uniqueChunkIds.size,
    matchedChunkCount: uniqueChunkIds.size, // Unique chunks represented
    // ...
  }
  ```
- **Runtime Behavior Before**: 5 candidate chunks + 2 vector chunks resulted in `matchedChunkCount: 7`.
- **Runtime Behavior After**: Correctly computes unique count (e.g. 2 unique vector matched chunks out of 5 total chunks).
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 38, 41.

---

### Finding R9 — `departmentMatch` Is Not Actually a Match
- **Verification**: `departmentMatch: Boolean(raw.department)` returned `true` if a policy had a department, even when no department constraint was requested or when requested department differed.
- **Root Cause**: Existence check masquerading as constraint match check.
- **Remediation**:
  In `CandidateRetrievalService`:
  ```typescript
  departmentMatch: constraints?.department
    ? Boolean(raw.department && raw.department.toLowerCase() === constraints.department.toLowerCase())
    : undefined,
  ministryMatch: constraints?.ministry
    ? Boolean(raw.ministry && raw.ministry.toLowerCase().includes(constraints.ministry.toLowerCase()))
    : undefined,
  ```
  Applied same logic to `stateMatch`, `beneficiaryCategoryMatch`, `policyClassificationMatch`.
- **Runtime Behavior Before**: `departmentMatch: true` whenever department string was non-empty.
- **Runtime Behavior After**: `undefined` when no constraint was requested; `true` on match; `false` on mismatch.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 39, 40.

---

### Finding R10 & R11 — Prisma Repository Scalability & Ordering Determinism
- **Verification**: `take: limit * 3` was executed without `orderBy`, leading to non-deterministic selection under pagination.
- **Root Cause**: Development prototype relied on arbitrary database read order.
- **Remediation**:
  1. Added deterministic multi-column ordering in `prisma.policyDocument.findMany`:
     `orderBy: [{ documentNumber: 'asc' }, { id: 'asc' }]`.
  2. Pushed `status: 'ACTIVE'` and active version checks into database query conditions.
  3. Retained documented bounded take for V1 baseline while documenting `GAP-RET-001`.
- **Runtime Behavior Before**: Database returned policies in arbitrary heap order, potentially dropping candidates before in-memory filtering.
- **Runtime Behavior After**: Stable, deterministic candidate ordering.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 49, 50.

---

### Finding R12 — `totalCandidates` Semantics
- **Verification**: `totalCandidates` returned the count of candidates *after* `slice(0, maxCandidates)`.
- **Root Cause**: Conflation of total eligible retrieval candidates with returned page size.
- **Remediation**:
  Updated `CandidateRetrievalResult`:
  - `totalCandidates`: Count of candidates before `maxCandidates` truncation.
  - `returnedCandidates`: Count of candidates actually returned (`candidates.length`).
- **Runtime Behavior Before**: Truncated candidate count was labeled `totalCandidates`.
- **Runtime Behavior After**: Caller can distinguish total matching candidates from truncated returned page.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 50, 51.

---

### Finding R13 — `findChunksByVersionIds` Dead Code
- **Verification**: `ICandidateRetrievalRepository.findChunksByVersionIds` was declared and implemented in `PrismaCandidateRetrievalRepository`, but never called in any service or pipeline.
- **Root Cause**: Leftover method from early chunk retrieval prototype.
- **Remediation**:
  Removed `findChunksByVersionIds` from `ICandidateRetrievalRepository` and `PrismaCandidateRetrievalRepository`. Cleaned test mocks.
- **Runtime Behavior Before**: Unused repository method and test scaffolding.
- **Runtime Behavior After**: Zero dead methods; clean interface surface.

---

### Finding R14 — Module Duplicate Provider Registration
- **Verification**: `CandidateRetrievalModule` registered both string tokens (`CANDIDATE_RETRIEVAL_REPOSITORY`, `SEMANTIC_ALIGNMENT_SERVICE`) and concrete class providers (`PrismaCandidateRetrievalRepository`, `SemanticAlignmentService`).
- **Root Cause**: Redundant dual registration pattern.
- **Remediation**:
  Cleaned provider definitions to use NestJS `useExisting` aliases pointing to token providers. Imported `CitizenModule` to provide `CitizenQueryService` for authoritative fact lookup.
- **Runtime Behavior Before**: Potential instantiation of multiple singleton instances.
- **Runtime Behavior After**: Exact singletons across token and class injections.

---

### Finding R15 — `RuleEngine` Non-Invocation Test Was Weak
- **Verification**: Previous test only asserted that `candidates[0].passedRules === undefined`.
- **Root Cause**: Negative property check instead of execution spy assertion.
- **Remediation**:
  Added adversarial spy test in `remediation-adversarial.spec.ts` (Test H.42):
  ```typescript
  const spy = vi.spyOn(RuleEngineService.prototype, 'evaluateRule');
  await retrievalService.retrieveCandidates(...);
  expect(spy).not.toHaveBeenCalled();
  ```
- **Runtime Behavior Before**: RuleEngine could hypothetically run in background without failing test.
- **Runtime Behavior After**: Strict guarantee that `RuleEngineService.evaluateRule` is never invoked.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Test 42.

---

### Finding R16 — Version Isolation Test Was Too Weak
- **Verification**: Previous test asserted that vector adapter filtered by version. It did not test if `CandidateRetrievalService` would defend against an errant vector provider returning cross-version chunks.
- **Root Cause**: Missing fusion-layer version defense test.
- **Remediation**:
  1. In `CandidateRetrievalService`, reinforced defensive check:
     ```typescript
     const vMatches = vectorMatches.filter(
       (vm) => vm.versionId === raw.policyVersionId && vm.documentId === raw.policyId,
     );
     ```
  2. Added test scenario where mock vector search maliciously returns chunk with `versionId: 'wrong-version'`. Asserted that fusion rejects chunk and vector score is ignored.
- **Runtime Behavior Before**: Fusion could potentially incorporate mismatched version vectors if adapter malfunctioned.
- **Runtime Behavior After**: Hard defensive check in service fusion layer rejects cross-version chunks.
- **Proving Tests**: `remediation-adversarial.spec.ts`: Tests 35, 36, 37.

---

## 4. Final Verification Summary

- **TypeScript Compilation (`tsc --noEmit`)**: 0 errors
- **Prisma Migration Status (`prisma migrate status`)**: Database schema up to date (1 migration)
- **Candidate Retrieval Tests (`vitest run test/unit/candidate-retrieval`)**: 82 passed (4 test files, 0 failed)
- **Semantic Contract Tests (`vitest run test/unit/semantic`)**: 29 passed (1 test file, 0 failed)
- **Full Backend Test Suite (`vitest run`)**: 430 passed (81 test files, 0 failed, 0 regressions)
- **Final Audit Verdict**: **GREEN**
