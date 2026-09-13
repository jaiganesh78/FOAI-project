# S12B Final Hardening Test Matrix (H1 + H2)

**Audit & Certification Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Workspace:** `D:\FOAI_PROJECT`  
**Current Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Status:** Certified GREEN (100% Passing)

---

## 1. Executive Summary & Mechanical Reconciliation Table

| Test Suite / Category | File Path | Tests Executed | Tests Passed | Tests Failed | Status |
|---|---|:---:|:---:|:---:|:---:|
| **H1: Trust Boundary Separation** | `test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts` | 15 | 15 | 0 | **PASS** |
| **H2: True Hybrid Retrieval** | `test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts` | 22 | 22 | 0 | **PASS** |
| **S12B Base Retrieval** | `test/unit/candidate-retrieval/candidate-retrieval.spec.ts` | 7 | 7 | 0 | **PASS** |
| **S12B Remediation Adversarial** | `test/unit/candidate-retrieval/remediation-adversarial.spec.ts` | 57 | 57 | 0 | **PASS** |
| **S12B Invariant Adversarial** | `test/unit/candidate-retrieval/retrieval-adversarial.spec.ts` | 13 | 13 | 0 | **PASS** |
| **S12B Semantic Alignment** | `test/unit/candidate-retrieval/semantic-alignment.spec.ts` | 10 | 10 | 0 | **PASS** |
| **Subtotal: Candidate Retrieval** | **6 Test Files** | **124** | **124** | **0** | **PASS** |
| **Frozen V1 Semantic Core** | `test/unit/semantic/semantic-contract.spec.ts` | 29 | 29 | 0 | **PASS** |
| **Total S12B Domain Suite** | **7 Test Files** | **153** | **153** | **0** | **PASS** |
| **Full Backend Regression Suite** | **83 Test Files** | **472** | **472** | **0** | **PASS** |

### Mathematical Reconciliation:
- **Pre-H1/H2 Baseline**: 87 candidate retrieval tests (7 Base + 57 Remediation + 13 Invariant + 10 Alignment) across 4 files. Full backend: 435 tests across 81 files.
- **H1 Addition**: +15 tests in `h1-trust-boundary-adversarial.spec.ts`.
- **H2 Addition**: +22 tests in `h2-true-hybrid-adversarial.spec.ts`.
- **Candidate Retrieval Total**: $87 + 15 + 22 = 124$ tests across 6 files.
- **S12B Domain Total**: $124 \text{ (Candidate Retrieval)} + 29 \text{ (Semantic Contract)} = 153$ tests across 7 files.
- **Full Backend Total**: $435 + 15 + 22 = 472$ tests across 83 files.
- **Reconciliation Note on Previous 152 vs 153 Anomaly**: An earlier summary erroneously recorded `candidate-retrieval.spec.ts` as containing 6 tests instead of its actual 7 tests ($15 + 22 + 6 + 57 + 13 + 10 + 29 = 152$). The 7th test is `sorts candidates descending by retrievalScore and respects maxCandidates limit` (lines 220–238). Correcting this restores exact mechanical equality: $15 + 22 + 7 + 57 + 13 + 10 + 29 = 153$.

---

## 2. H1: Citizen Fact Trust Boundary Adversarial Suite (15 Tests)

File: [`apps/backend/test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts`](file:///D:/FOAI_PROJECT/apps/backend/test/unit/candidate-retrieval/h1-trust-boundary-adversarial.spec.ts)

| Test ID | Test Description | Invariant Verified | Result |
|---|---|---|:---:|
| **H1-01** | `cross-citizen request still returns 403 ForbiddenException` | Cross-citizen impersonation strictly forbidden; ownership enforced | PASS |
| **H1-02** | `authenticated user server facts are actually loaded via CitizenQueryService` | Server authoritative facts loaded strictly from DB via `CitizenQueryService` | PASS |
| **H1-03** | `conflicting client value cannot override server authoritative value` | Server authoritative value takes strict precedence; client hint cannot overwrite | PASS |
| **H1-04** | `registered client-only semantic fact does not become authoritative` | Registered client-only fact strictly tagged `EXPLORATORY_HINT`; NEVER in `canonicalFacts` | PASS |
| **H1-05** | `unknown client semantic fact fails closed without escape hatch` | Unknown client semantic fact pushed to `unresolvedInputs`; fails closed | PASS |
| **H1-06** | `client cannot inject arbitrary canonical dotted key` | Unregistered dotted keys (e.g. `CUSTOM.HACK`) fail closed into `unresolvedInputs` | PASS |
| **H1-07** | `client-only occupation hint cannot become authoritative occupation` | Occupation hint populates `exploratoryPrimaryOccupation`; `primaryOccupation` is undefined | PASS |
| **H1-08** | `client-only income hint cannot become authoritative income` | Income hint populates `exploratoryHints`; `annualIncomeInr` is undefined | PASS |
| **H1-09** | `client-only land area hint cannot become authoritative land area` | Land area hint populates `exploratoryHints`; `landHoldingHectares` is undefined | PASS |
| **H1-10** | `client-only age hint cannot become authoritative age` | Age hint populates `exploratoryAgeYears`; `ageYears` is undefined | PASS |
| **H1-11** | `authoritative canonicalFacts contain only server-authoritative facts` | `canonicalFacts` and `canonicalAttributesPresent` strictly contain authoritative facts | PASS |
| **H1-12** | `exploratory hints are explicitly separated from canonical authoritative facts in AlignedCitizenSignals` | Structural segregation in `AlignedCitizenSignals` (`canonicalFacts` vs `exploratoryHints`) | PASS |
| **H1-13** | `extractS13AuthoritativeContext firewall strictly excludes retrieval hints` | S13 eligibility context contains zero retrieval hints or exploratory values | PASS |
| **H1-14** | `free-text search query cannot create canonical or exploratory semantic facts` | Free-text search query cannot pollute canonical semantic facts or registry | PASS |
| **H1-15** | `PII in retrieval hints is stripped and cannot leak into canonical facts, warnings, or logs` | Aadhaar, PAN, Bank Account, Mobile stripped at ingress; zero PII leakage | PASS |

---

## 3. H2: True Hybrid Retrieval Adversarial Suite (22 Tests)

File: [`apps/backend/test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts`](file:///D:/FOAI_PROJECT/apps/backend/test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts)

| Test ID | Test Description | Invariant Verified | Result |
|---|---|---|:---:|
| **PROOF** | `H2 vector discovery can recover a policy excluded from structured candidate retrieval` | **Mandatory Architectural Proof**: Independent vector channel recovers policy excluded from structured filter | PASS |
| **H2-01** | `structured-only mode does not invoke vector retrieval provider` | Vector search provider and embedding provider not invoked in `STRUCTURED_ONLY` | PASS |
| **H2-02** | `hybrid mode invokes structured retrieval` | Structured retrieval executed in `HYBRID` mode | PASS |
| **H2-03** | `hybrid mode invokes independent vector retrieval with corpusScope` | Vector search invoked across `ACTIVE_CURRENT_POLICY_VERSIONS` without candidate ID restriction | PASS |
| **H2-04** | `vector candidate not present in structured set is retained` | Vector-only candidate discovered and retained in output candidates | PASS |
| **H2-05** | `structured candidate with no vector match remains retained` | Structured-only candidate retained in output candidates | PASS |
| **H2-06** | `candidate returned by both channels is deduplicated by exact PolicyVersion` | Candidate matched by both channels merged into single candidate with `HYBRID` method | PASS |
| **H2-07** | `vector-only candidate has no fabricated structured match flags (undefined)` | Truthful evidence: `stateMatch`, `beneficiaryCategoryMatch`, etc. are undefined for vector-only | PASS |
| **H2-08** | `structured-only candidate has no fabricated vector score` | Truthful evidence: `vectorScore` is undefined for structured-only | PASS |
| **H2-09** | `vector match with wrong documentId is rejected (document-level mismatch)` | Version-document integrity: cross-document chunk matches rejected | PASS |
| **H2-10** | `vector match with unknown/wrong versionId is rejected` | Version integrity: unregistered or non-existent policy version matches rejected | PASS |
| **H2-11** | `inactive or superseded vector version cannot enter active candidate results` | Lifecycle integrity: superseded versions (`isCurrent: false`) rejected | PASS |
| **H2-12** | `deterministic fusion produces identical ordering across multiple runs` | Mathematical determinism: identical inputs produce identical scores and ordering | PASS |
| **H2-13** | `tie-breaking deterministically uses score DESC, documentNumber ASC, policyVersionId ASC` | 3-tier deterministic tie-breaking produces identical ranking | PASS |
| **H2-14** | `vector similarity remains relevance score only; contains zero eligibility fields` | Zero eligibility booleans (`isEligible`, `passedRules`, `failedRules`, `eligibilityConfidence`) | PASS |
| **H2-15** | `candidate retrieval does not instantiate or invoke RuleEngineService` | RuleEngineService completely absent from retrieval architecture | PASS |
| **H2-16** | `policy numeric thresholds (income ceiling, land limit) are NOT evaluated during retrieval` | S12B does not evaluate policy thresholds (e.g. land ceiling); preserved for S13 | PASS |
| **H2-17** | `vector retrieval failure produces PARTIAL_RESULTS when structured retrieval succeeds` | Partial failure semantics: vector error degrades gracefully to `PARTIAL_RESULTS` | PASS |
| **H2-18** | `structured retrieval database failure produces RETRIEVAL_FAILURE` | Critical failure semantics: DB error returns `RETRIEVAL_FAILURE` with 0 candidates | PASS |
| **H2-19** | `no candidates found by structured or vector produces NO_RESULTS` | Empty result semantics: returns `NO_RESULTS` with 0 candidates | PASS |
| **H2-20** | `hybrid retrieval scrubs Aadhaar, PAN, and bank accounts before calling embedding provider` | PII protection: search queries scrubbed with regex before vector embedding | PASS |
| **SEC-22** | `correctly computes totalCandidates as qualifying working-set count when bounded by maxCandidates` | Precision contract: 20 qualifying working-set candidates with `maxCandidates=10` yields `totalCandidates=20`, `returnedCandidates=10` | PASS |

---

## 4. Verification Commands & Execution Logs

### A. Candidate Retrieval Suite
```bash
npx vitest run test/unit/candidate-retrieval
```
- **Files:** 6 passed (6)
- **Tests:** 124 passed (124)
- **Duration:** 2.82s

### B. Frozen Semantic Contract Suite
```bash
npx vitest run test/unit/semantic
```
- **Files:** 1 passed (1)
- **Tests:** 29 passed (29)
- **Duration:** 1.56s

### C. Total S12B Domain Suite
```bash
npx vitest run test/unit/candidate-retrieval test/unit/semantic
```
- **Files:** 7 passed (7)
- **Tests:** 153 passed (153)
- **Duration:** 2.88s

### D. Full Backend Regression Tests
```bash
npx vitest run
```
- **Files:** 83 passed (83)
- **Tests:** 472 passed (472)
- **Duration:** 25.32s

### E. TypeScript Compilation
```bash
npx tsc --noEmit
```
- **Errors:** 0 errors
- **Exit Code:** 0

### F. Prisma Database Migration Status
```bash
npx prisma migrate status
```
- **Migrations:** 1 migration found in prisma/migrations
- **Status:** Database schema is up to date (0 drift)
