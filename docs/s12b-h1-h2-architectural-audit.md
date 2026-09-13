# S12B Final Architectural Hardening Audit Report (H1 + H2)

**Audit Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Workspace:** `D:\FOAI_PROJECT`  
**Current Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Status:** Certified GREEN

---

## 1. Architectural Overview & Hardening Scope

Sprint 12B establishes the foundational candidate retrieval and semantic alignment subsystem for the Government Policy Intelligence and Orchestration System (GPIOS). Candidate retrieval answers the question:
> **"Which policy versions are relevant candidates for downstream evaluation?"**
> It does **NEVER** answer: **"Is this citizen eligible?"**

During independent architectural audit of the initial S12B implementation, two architectural deficiencies were identified:
1. **Issue H1 (Citizen Fact Trust Boundary)**: Client-supplied exploratory hints and server-authoritative profile facts were merged into a single dictionary (`facts`), allowing client-provided registered semantic attributes absent from the profile to silently become canonical facts without structural trust separation.
2. **Issue H2 (True Hybrid Candidate Retrieval)**: Vector search was constrained to the version IDs returned by structured retrieval (`versionFilter: versionIds`), operating as a mere reranker rather than true independent hybrid candidate discovery.

This hardening pass surgically restructured the domain contracts, controller, services, and repository layers to resolve both issues cleanly, verified by 37 new adversarial tests (15 for H1, 22 for H2) and a 472-test full regression suite with zero TypeScript errors and zero database drift.

---

## 2. Issue H1 — Citizen Fact Trust Boundary Architecture

### 2.1 Pre-Hardening Defect Analysis
In the pre-hardening architecture:
- `CandidateRetrievalRequest.citizenContext` had `{ userId?: string; facts: Record<string, unknown> }`.
- `CandidateRetrievalController` merged server facts over client facts: `effectiveFacts = { ...clientFacts, ...authoritativeFacts }`.
- If a client provided a registered semantic attribute that was absent from the server profile (e.g. Server: `occupation = absent`; Client: `occupation = BUSINESS_OWNER`), `BUSINESS_OWNER` was absorbed into `effectiveFacts`.
- `SemanticAlignmentService.alignCitizenFacts` resolved `BUSINESS_OWNER` against the frozen registry and placed it into `canonicalFacts['OCCUPATION.CATEGORY'] = 'BUSINESS_OWNER'`.
- Downstream systems could not structurally distinguish an authoritative fact verified from the citizen database from an unverified caller hint.

### 2.2 Post-Hardening Trust Boundary Architecture
We introduced an explicit structural trust separation in contracts and execution paths:

```
                  ┌───────────────────────────────────────────────────────────┐
                  │                    HTTP / Ingress Payload                 │
                  └─────────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                                   CandidateRetrievalController
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
       [Authenticated Identity]                                      [Caller Payload Hints]
                 │                                                             │
                 ▼                                                             │
        CitizenQueryService                                                    │
                 │                                                             │
                 ▼                                                             ▼
    authoritativeCitizenFacts                                           retrievalHints
     (Trusted Server Profile)                                      (Exploratory Caller Hints)
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                │
                                                ▼
                                    SemanticAlignmentService
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
          canonicalFacts                                                exploratoryHints
   (Authoritative Semantic Facts)                              (Non-Authoritative Exploratory Signals)
                 │                                                             │
                 ▼                                                             │
   ┌───────────────────────────┐                                               │
   │ S13 ELIGIBILITY FIREWALL  │                                               │
   ├───────────────────────────┤                                               │
   │ S13 Eligibility Engine    │ ◄─── (Authoritative Facts Only)               │
   │                           │  X── (Hints FORBIDDEN from crossing firewall) │
   └───────────────────────────┘                                               ▼
                                                                  Candidate Retrieval Filtering
                                                                    (Exploratory Guidance Only)
```

### 2.3 Structural Enforcement Details
1. **Contract Types (`CandidateRetrievalCitizenContext`)**:
   - `authoritativeCitizenFacts`: Populated strictly server-side by `CitizenQueryService.getStructuredFactsByUserId`.
   - `retrievalHints`: Optional caller-provided exploratory hints.
   - `facts`: Maintained strictly as backward-compatibility input; mapped by controller to `retrievalHints`.
2. **Controller Guard (`CandidateRetrievalController`)**:
   - Re-asserts cross-citizen access check: throws `ForbiddenException` (403) if `citizenContext.userId !== user.userId`.
   - Populates `authoritativeCitizenFacts` strictly from `CitizenQueryService`.
   - Places client-supplied values strictly into `retrievalHints`.
   - Overwrites any client attempt to supply `authoritativeCitizenFacts` directly.
3. **Semantic Alignment (`SemanticAlignmentService`)**:
   - **Case A (Unknown client fact)**: Fails closed into `unresolvedInputs`. Never enters `canonicalFacts` or `exploratoryHints`.
   - **Case B (Conflicting client fact)**: Server authoritative fact remains authoritative. Client hint is ignored.
   - **Case C (Registered client fact absent from server profile)**: Resolved against frozen registry, but strictly placed into `exploratoryHints` with `factProvenance = 'EXPLORATORY_HINT'`. Never enters `canonicalFacts`.
   - **Arbitrary dotted keys (e.g. `CUSTOM.HACK`)**: Fail closed into `unresolvedInputs`. Zero escape hatches.
4. **S13 Eligibility Firewall (`extractS13AuthoritativeContext`)**:
   - Shared contract function `extractS13AuthoritativeContext(request, alignedSignals)` extracts strictly authoritative facts, stripping all hints before downstream handoff.

---

## 3. Issue H2 — True Hybrid Candidate Retrieval Architecture

### 3.1 Pre-Hardening Defect Analysis
In the pre-hardening architecture:
- `CandidateRetrievalService` queried structured candidates: `rawPolicies = await repository.findStructuredCandidates(...)`.
- When in `HYBRID` mode, it passed `versionFilter: rawPolicies.map(p => p.policyVersionId)` to vector search.
- It then looped solely over `for (const raw of rawPolicies)`.
- Consequently, if a policy was not selected by structured retrieval (e.g. filtered by state, or outside the initial fetch limit), vector retrieval could never discover it.
- This was an anti-pattern: structured filtering followed by vector reranking, not true hybrid candidate retrieval.

### 3.2 Post-Hardening True Hybrid Architecture
We decoupled vector search from structured candidate IDs, establishing true independent candidate discovery:

```
                            ┌── Structured Retrieval Channel ──────┐
                            │ - Queries Prisma DB                  │
                            │ - State, Category, Ministry, Dept    │
                            │ - Semantic Attribute Overlap         │
                            │ - Limit = maxCandidates * 2          │
                            └──────────────────┬───────────────────┘
                                               │
                                               ▼
                                      [Structured Candidates]
                                               │
Policy Corpus ─────────────────────────────────┼──────────────────────────────┐
                                               │                              │
                                               ▼                              ▼
                                     Candidate Fusion & Union ◄──── [Vector Matches]
                                               │                              ▲
                                               │                              │
                            ┌── Independent Vector Channel ────────┐          │
                            │ - Vector search across active corpus │──────────┘
                            │ - corpusScope = ACTIVE_CURRENT       │
                            │ - NO candidate ID restriction        │
                            │ - Limit = maxCandidates * 3          │
                            └──────────────────────────────────────┘
                                               │
                                               ▼
                              Version & Document Safety Validation
                               (Rejects inactive/superseded/mismatched)
                                               │
                                               ▼
                                     Deterministic Fusion
                                - Hybrid: 0.6 * Struct + 0.4 * Vector
                                - Vector-Only: Vector score
                                - Struct-Only: Struct score
                                               │
                                               ▼
                                      Truthful Evidence
                                (Zero fabricated structured flags)
                                               │
                                               ▼
                                   3-Tier Tie-Break Ranking
                                (score DESC, docNum ASC, verId ASC)
                                               │
                                               ▼
                                      Bounded Truncation
                                       (maxCandidates)
```

### 3.3 Core Implementation Safeguards
1. **Independent Retrieval Execution**:
   - Vector search is executed with `corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS'` without `versionFilter`.
   - Vector provider searches the active policy corpus independently.
2. **Missing Metadata Resolution (`findCandidatePolicyVersionsByIds`)**:
   - When vector search discovers a version ID not returned by structured search, `repository.findCandidatePolicyVersionsByIds([missingVersionIds])` fetches its metadata.
   - Enforces database constraints: `isCurrent: true`, `document.status: ACTIVE`, `document.deletedAt: null`.
3. **Version & Document Safety (H2-09, H2-10, H2-11)**:
   - Every vector match is validated against active versions.
   - If `vm.versionId` is not in active versions, it is rejected.
   - If `vm.documentId !== raw.policyId`, it is rejected.
   - Superseded versions cannot enter candidate results.
4. **Candidate Union & Deduplication (H2-04, H2-05, H2-06)**:
   - Candidates from both channels are unioned and deduplicated by exact `PolicyVersionId`.
   - Method tagged truthfully:
     - Found by both: `retrievalMethod = 'HYBRID'`, score = `0.6 * struct + 0.4 * vector`.
     - Found by structured only: `retrievalMethod = 'STRUCTURED'`, vectorScore = `undefined`.
     - Found by vector only: `retrievalMethod = 'VECTOR'`, vectorScore = `bestVectorScore`.
5. **Truthful Evidence (H2-07, H2-08, Section 21)**:
   - Vector-only candidates have `stateMatch = undefined`, `beneficiaryCategoryMatch = undefined`, `referencedAttributes = []`.
   - Structured match flags are NEVER fabricated for vector-only candidates.
6. **Mandatory Architectural Proof Test**:
   - `test/unit/candidate-retrieval/h2-true-hybrid-adversarial.spec.ts` proves that Policy B (excluded from structured retrieval due to state mismatch) is discovered independently by vector search and returned as a candidate with `retrievalMethod: 'VECTOR'`.

---

## 4. Invariants Compliance Matrix

| Invariant | Requirement | Implementation Evidence | Verdict |
|---|---|---|:---:|
| **Inv 1** | Frozen V1 Semantic Core remains frozen | Zero edits to `SemanticRegistryService`, canonical codes, or vocabularies | **COMPLIANT** |
| **Inv 2** | Candidate retrieval != eligibility evaluation | Answers "which policies are candidates", never "is citizen eligible" | **COMPLIANT** |
| **Inv 3** | RuleEngineService must NOT be invoked | RuleEngineService is not injected, imported, or invoked by retrieval | **COMPLIANT** |
| **Inv 4** | ContextEngineService must NOT be integrated | Deferred to S13 as GAP-RET-002; zero integration in S12B | **COMPLIANT** |
| **Inv 5** | No eligibility booleans in retrieval output | Zero fields: `isEligible`, `eligibilityConfidence`, `passedRules`, `failedRules` | **COMPLIANT** |
| **Inv 6** | Vector similarity is retrieval relevance only | Scores represent candidate relevance; strictly not eligibility confidence | **COMPLIANT** |
| **Inv 7** | LLMs and embeddings prohibited from semantic authority | Semantic alignment relies strictly on frozen deterministic registry | **COMPLIANT** |
| **Inv 8** | Do not implement V2 ontology / semantic inference | No graph inference, no LLM semantic guessing, fail-closed behavior | **COMPLIANT** |
| **Inv 9** | No speculative database migrations | Zero new Prisma migrations; schema is 100% up to date | **COMPLIANT** |
| **Inv 10** | Do not add fake pgvector persistence | Production pgvector persistence honestly tracked as GAP-RET-001 | **COMPLIANT** |
| **Inv 11** | Do not weaken security or trust boundaries | 403 cross-citizen access preserved; PII purged; strict Zod validation | **COMPLIANT** |
| **Inv 12** | Do not solve architectural problems by documentation alone | Complete code, contract, service, repository, and test implementation | **COMPLIANT** |

---

## 5. Security & Privacy Hardening

1. **Identity & Ownership Verification**:
   - JWT authentication via `JwtAuthGuard`.
   - `validRequest.citizenContext.userId !== user.userId` throws `ForbiddenException` (403).
2. **PII Sanitization & Ingress Scrubbing**:
   - `SENSITIVE_FACT_KEYS` (Aadhaar, PAN, Bank Account, Phone, Mobile, Email) purged at ingress from authoritative facts and retrieval hints.
   - Values entering audit or `unresolvedInputs` sanitized with regex replacement `[REDACTED_IDENTIFIER]`.
   - Free-text search queries scrubbed before being passed to `generateEmbedding`.
3. **Payload Sanitization**:
   - `candidateRetrievalRequestSchema` enforces `.strict()` at root and `citizenContext` levels, rejecting undeclared properties.
4. **Provenance & Auditability**:
   - Every candidate output includes deterministic `provenance` (`documentId`, `versionId`, `sourceId`, `retrievedAt`).
   - Replaced overstated "cryptographic provenance" language with truthful "deterministic policy-version provenance and traceability".

---

## 6. Remaining Production Gaps (Maintained Honestly)

| Gap ID | Description | Current Status | Target Sprint |
|---|---|---|:---:|
| **GAP-RET-001** | Production pgvector persistence & indexing | Deterministic test adapter used for unit/adversarial testing; production pgvector tables and HNSW indexing deferred | Production / Infra Pass |
| **GAP-RET-002** | ContextEngineService upstream integration | Intentionally decoupled in S12B; context engine integration scheduled for S13 | Sprint 13 |
| **GAP-RET-003** | Production-scale structured query optimization (SQL pushdown) | Working-set in-memory filtering bounded by limit headroom; JSON condition pushdown deferred | Production DB Tuning |

---

## 7. Final Verdict

**VERDICT: GREEN**

Every acceptance condition defined in the S12B Final Architectural Hardening specification has been fully satisfied and adversarially verified.
