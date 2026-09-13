# S12B FINAL ARCHITECTURAL HARDENING VERIFICATION

## 1. Verdict

**GREEN**

Every architectural invariant, contract boundary, security guard, true hybrid retrieval requirement, adversarial test, and documentation standard has been fully implemented, verified, and reconciled across the codebase.

---

## 2. Executive Summary

Sprint 12B ("Candidate Retrieval & Semantic Alignment Foundation") has completed its Final Architectural Hardening pass over the remaining two architectural issues identified during independent audit:

1. **Issue H1 — Citizen Fact Trust Boundary**: Structurally separated server-authoritative citizen profile facts (`authoritativeCitizenFacts`, loaded strictly from `CitizenQueryService`) from caller-provided exploratory hints (`retrievalHints`). Caller hints can never overwrite server facts, can never enter `canonicalFacts` or `canonicalAttributesPresent`, and can never cross the S12 → S13 firewall into eligibility evaluation.
2. **Issue H2 — True Hybrid Retrieval**: Decoupled vector retrieval from structured candidate IDs. In `HYBRID` mode, vector search runs independently across the active policy corpus (`corpusScope = 'ACTIVE_CURRENT_POLICY_VERSIONS'`). Candidate versions discovered by either channel are unioned and deduplicated by exact `PolicyVersionId`. Version metadata for vector-only candidates is resolved via `findCandidatePolicyVersionsByIds`, and vector-only candidates have truthful evidence with zero fabricated structured match flags.

The system now genuinely deserves GREEN certification.

---

## 3. Historical Baseline Progression

Prior to implementing H1 and H2 changes, the baseline was independently measured and recorded:

- **Historical Pre-Hardening Candidate Retrieval Tests**: 87 passed (4 test files: `candidate-retrieval.spec.ts` [7], `remediation-adversarial.spec.ts` [57], `retrieval-adversarial.spec.ts` [13], `semantic-alignment.spec.ts` [10]).
- **Frozen Semantic Contract Tests**: 29 passed (1 test file: `semantic-contract.spec.ts`).
- **Historical Full Backend Tests**: 435 passed (81 test files).
- **H1 Addition**: +15 tests in `h1-trust-boundary-adversarial.spec.ts`.
- **H2 Addition**: +22 tests in `h2-true-hybrid-adversarial.spec.ts`.
- **Current Candidate Retrieval Tests**: 124 passed (6 test files).
- **Current Total S12B Domain Tests**: 153 passed (7 test files).
- **Current Full Backend Tests**: 472 passed (83 test files).
- **TypeScript**: 0 errors (`npx tsc --noEmit`).
- **Prisma Migrations**: Up to date (1 migration found, 0 drift).
- **Frozen V1 Semantic Core**: 100% untouched.
- **RuleEngineService**: Isolated (0 invocations).

---

## 4. H1 Trust Boundary Architecture

The trust boundary is structurally enforced at three layers:
1. **Contract Layer (`CandidateRetrievalCitizenContext`)**:
   - `authoritativeCitizenFacts?: Record<string, unknown>` — Trusted facts loaded server-side.
   - `retrievalHints?: Record<string, unknown>` — Optional caller exploratory hints.
   - `facts?: Record<string, unknown>` — Maintained for backward compatibility; strictly treated as `retrievalHints`.
2. **Controller Layer (`CandidateRetrievalController`)**:
   - Verifies JWT ownership: `validRequest.citizenContext.userId !== user.userId` throws 403 `ForbiddenException`.
   - Calls `citizenQueryService.getStructuredFactsByUserId(effectiveUserId)` to populate `authoritativeCitizenFacts`.
   - Maps caller values strictly into `retrievalHints`. An external caller cannot supply authoritative facts.
3. **Alignment Layer (`SemanticAlignmentService`)**:
   - Authoritative facts populate `canonicalFacts` and `canonicalAttributesPresent`.
   - Exploratory hints populate `exploratoryHints` and `exploratoryAttributeCodes`.
   - Conflicting hints cannot override server facts.
   - Absent registered hints cannot become canonical facts.
   - Unknown hints fail closed into `unresolvedInputs`.

---

## 5. H1 Data Flow

```
[Authenticated JWT Identity]
             │
             ▼
   CitizenQueryService.getStructuredFactsByUserId()
             │
             ▼
 authoritativeCitizenFacts ──────────────┐
                                         │
 Caller retrievalHints ──────────────────┼──► SemanticAlignmentService
                                         │            │
                                         │            ├─► canonicalFacts (Authoritative)
                                         │            ├─► exploratoryHints (Hints Only)
                                         │            └─► factProvenance ('AUTHORITATIVE' | 'EXPLORATORY_HINT')
                                         │
                                         ▼
                            Candidate Retrieval Service
                                         │
                                         ▼
                            S13 Eligibility Firewall
                             (extractS13AuthoritativeContext)
                             - Passes ONLY canonicalFacts
                             - Strips ALL retrieval hints
```

---

## 6. H1 Security Verification

- **Identity Spoofing**: Cross-citizen requests strictly return HTTP 403 `ForbiddenException`.
- **Server Fact Precedence**: A client sending `occupationCategory: "BUSINESS_OWNER"` when the server has `"STUDENT"` cannot override the server value.
- **Registered Client-Only Fact Isolation**: A client sending `occupationCategory: "BUSINESS_OWNER"` when absent from the server profile is placed strictly in `exploratoryHints` with `factProvenance = 'EXPLORATORY_HINT'`; it NEVER enters `canonicalFacts` or `canonicalAttributesPresent`.
- **Escape Hatch Elimination**: Unknown attributes (e.g. `inventedSemanticAttribute`) or arbitrary dotted keys (e.g. `CUSTOM.HACK.CODE`) fail closed into `unresolvedInputs`. Zero arbitrary canonical keys can be created.
- **Provenance Integrity**: Every resolved attribute is tagged with its origin (`'AUTHORITATIVE'` or `'EXPLORATORY_HINT'`).
- **PII Stripping**: Aadhaar, PAN, Bank Account, Phone, and Mobile numbers in hints are stripped at ingress, preventing leakage into warnings, logs, or embeddings.

---

## 7. H1 Adversarial Tests (15 Tests)

All 15 H1 adversarial tests in [`apps/backend/test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts`](file:///D:/FOAI_PROJECT/apps/backend/test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts) pass:

- **H1-01**: Cross-citizen request still returns 403 ForbiddenException
- **H1-02**: Authenticated user server facts are actually loaded via CitizenQueryService
- **H1-03**: Conflicting client value cannot override server authoritative value
- **H1-04**: Registered client-only semantic fact does not become authoritative (provenance = EXPLORATORY_HINT)
- **H1-05**: Unknown client semantic fact fails closed without escape hatch
- **H1-06**: Client cannot inject arbitrary canonical dotted key
- **H1-07**: Client-only occupation hint cannot become authoritative occupation
- **H1-08**: Client-only income hint cannot become authoritative income
- **H1-09**: Client-only land area hint cannot become authoritative land area
- **H1-10**: Client-only age hint cannot become authoritative age
- **H1-11**: Authoritative canonicalFacts contain only server-authoritative facts
- **H1-12**: Exploratory hints are explicitly separated from canonical authoritative facts in AlignedCitizenSignals
- **H1-13**: extractS13AuthoritativeContext firewall strictly excludes retrieval hints
- **H1-14**: Free-text search query cannot create canonical or exploratory semantic facts
- **H1-15**: PII in retrieval hints is stripped and cannot leak into canonical facts, warnings, or logs

---

## 8. H2 True Hybrid Architecture

1. **Independent Channels**:
   - Structured retrieval queries `PrismaCandidateRetrievalRepository.findStructuredCandidates()`.
   - Vector retrieval queries `IVectorSearchProvider.searchSimilarChunks(embedding, { corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS', maxResults, minScore: 0.0 })` without passing structured candidate IDs (`versionFilter: undefined`).
2. **Metadata Resolution (`findCandidatePolicyVersionsByIds`)**:
   - If vector search discovers a policy version not in the structured candidate pool, its full version metadata is fetched via `findCandidatePolicyVersionsByIds()`.
   - The query validates that the version belongs to an active, non-deleted document and is current (`isCurrent: true`).
3. **Defensive Version & Document Validation**:
   - `vm.documentId === raw.policyId && raw.isCurrent === true`.
   - Any mismatched or superseded vector matches are discarded.
4. **Union & Deduplication**:
   - Candidate versions from both channels are unioned and deduplicated by exact `PolicyVersionId`.
   - Method assigned truthfully: `STRUCTURED`, `VECTOR`, or `HYBRID`.
5. **Truthful Evidence Contract**:
   - Vector-only candidates have structured match flags set to `undefined` (`stateMatch`, `beneficiaryCategoryMatch`, `departmentMatch`, `ministryMatch`, `policyClassificationMatch`).
   - ZERO structured match flags are fabricated.
6. **Deterministic Scoring & Tie-Breaking**:
   - HYBRID score: `0.6 * structuredScore + 0.4 * normalizedVectorScore`.
   - Single-channel candidates use their respective normalized scores.
   - 3-tier tie-breaking: `retrievalScore DESC`, `documentNumber ASC`, `policyVersionId ASC`.

---

## 9. H2 Adversarial Tests (22 Tests)

All 22 H2 adversarial tests in [`apps/backend/test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts`](file:///D:/FOAI_PROJECT/apps/backend/test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts) pass:

- **Mandatory Proof Test**: H2 vector discovery recovers Policy B (which was excluded from structured retrieval due to state mismatch) as candidate with `retrievalMethod: 'VECTOR'`.
- **H2-01**: Structured-only mode does not invoke vector retrieval provider
- **H2-02**: Hybrid mode invokes structured retrieval
- **H2-03**: Hybrid mode invokes independent vector retrieval with corpusScope (no structured ID filter)
- **H2-04**: Vector candidate not present in structured set is retained
- **H2-05**: Structured candidate with no vector match remains retained
- **H2-06**: Candidate returned by both channels is deduplicated by exact PolicyVersion
- **H2-07**: Vector-only candidate has no fabricated structured match flags (undefined)
- **H2-08**: Structured-only candidate has no fabricated vector score
- **H2-09**: Vector match with wrong documentId is rejected (document-level mismatch)
- **H2-10**: Vector match with unknown/wrong versionId is rejected
- **H2-11**: Inactive or superseded vector version cannot enter active candidate results
- **H2-12**: Deterministic fusion produces identical ordering across multiple runs
- **H2-13**: Tie-breaking deterministically uses score DESC, documentNumber ASC, policyVersionId ASC
- **H2-14**: Vector similarity remains relevance score only; contains zero eligibility fields
- **H2-15**: Candidate retrieval does not instantiate or invoke RuleEngineService
- **H2-16**: Policy numeric thresholds (income ceiling, land limit) are NOT evaluated during retrieval
- **H2-17**: Vector retrieval failure produces PARTIAL_RESULTS when structured retrieval succeeds
- **H2-18**: Structured retrieval database failure produces RETRIEVAL_FAILURE
- **H2-19**: No candidates found by structured or vector produces NO_RESULTS
- **H2-20**: Hybrid retrieval scrubs Aadhaar, PAN, and bank accounts before calling embedding provider
- **Section 22**: Correctly computes `totalCandidates` as qualifying working-set count when bounded by `maxCandidates`

---

## 10. Architectural Firewall & Invariants Verification

1. **Frozen V1 Semantic Core**: Zero lines modified in `apps/backend/src/core/semantic/`. All 29 semantic contract tests pass.
2. **Zero Eligibility Evaluation**: `RuleEngineService.prototype.evaluateRule` is verified never called during retrieval. Zero eligibility booleans exist in candidate output.
3. **S13 Firewall Boundary**: S12B establishes and tests the authoritative-context extraction boundary that S13 MUST consume. ContextEngine/eligibility integration remains deferred to S13.
4. **Security Grounding**: Strict Zod validation rejects undeclared request properties; authentication, authorization, semantic validation and server-side fact resolution enforce the broader security boundary.
5. **Provenance Grounding**: Provenance is strictly deterministic policy-version provenance and traceability (`documentId`, `versionId`, `sourceId`, `retrievedAt`); zero unsubstantiated claims of cryptographic signing.
6. **Scalability Honesty**: `totalCandidates` represents qualifying working-set count per `GAP-RET-003`; production query pushdown is honestly deferred.

---

## 11. Mechanical Test Inventory & Reconciliation

### Domain Suites Breakdown:
| File | Test Count | Passed | Failed |
|---|:---:|:---:|:---:|
| `test/unit/candidate-retrieval/candidate-retrieval.spec.ts` | 7 | 7 | 0 |
| `test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts` | 15 | 15 | 0 |
| `test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts` | 22 | 22 | 0 |
| `test/unit/candidate-retrieval/remediation-adversarial.spec.ts` | 57 | 57 | 0 |
| `test/unit/candidate-retrieval/retrieval-adversarial.spec.ts` | 13 | 13 | 0 |
| `test/unit/candidate-retrieval/semantic-alignment.spec.ts` | 10 | 10 | 0 |
| **Candidate Retrieval Total (6 files)** | **124** | **124** | **0** |
| `test/unit/semantic/semantic-contract.spec.ts` | 29 | 29 | 0 |
| **Total S12B Domain Suite (7 files)** | **153** | **153** | **0** |
| **Other Backend Test Suites (76 files)** | **319** | **319** | **0** |
| **Full Backend Regression Suite (83 files)** | **472** | **472** | **0** |

---

## 12. Verification Commands & Execution Logs

### A. Candidate Retrieval Suite
```bash
npx vitest run test/unit/candidate-retrieval
Test Files  6 passed (6)
Tests       124 passed (124)
Duration    2.82s
Exit Code:  0
```

### B. Frozen Semantic Contract Suite
```bash
npx vitest run test/unit/semantic
Test Files  1 passed (1)
Tests       29 passed (29)
Duration    1.56s
Exit Code:  0
```

### C. Total S12B Domain Suite
```bash
npx vitest run test/unit/candidate-retrieval test/unit/semantic
Test Files  7 passed (7)
Tests       153 passed (153)
Duration    2.88s
Exit Code:  0
```

### D. Full Backend Regression Suite
```bash
npx vitest run
Test Files  83 passed (83)
Tests       472 passed (472)
Duration    25.32s
Exit Code:  0
```

### E. TypeScript Check
```bash
npx tsc --noEmit
Exit Code:  0 (0 errors)
```

### F. Prisma Migration Status
```bash
npx prisma migrate status
1 migration found in prisma/migrations
Database schema is up to date! (0 drift)
Exit Code:  0
```

---

## 13. Remaining Integration Gaps (Tracked Honestly)

1. **`GAP-RET-001`**: Production pgvector persistence and HNSW vector index deployment.
2. **`GAP-RET-002`**: ContextEngineService upstream integration scheduled for Sprint 13.
3. **`GAP-RET-003`**: Production-scale database query pushdown for rule condition JSON queries.

---

## 14. Final Certification

**CERTIFICATION: GREEN**

All 15 final certification conditions are satisfied:
1. Actual test counts are mechanically reconciled (124 candidate retrieval + 29 semantic = 153 domain; 472 full suite).
2. All S12B documents agree on current counts.
3. No stale current-architecture descriptions remain.
4. H1 actual code matches H1 documentation.
5. H2 actual code matches H2 documentation.
6. H2 independent discovery test is real and passing.
7. Registered client-only fact test is real and passing.
8. No frozen semantic-core changes.
9. No ContextEngine integration.
10. No RuleEngine invocation.
11. No fake production vector persistence.
12. No cryptographic or prototype-pollution overclaims.
13. TypeScript passes with 0 errors.
14. Prisma passes with 0 drift.
15. Full backend suite passes with 472/472 passing tests.
