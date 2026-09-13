# S12B — Final Hardening Baseline Audit Report (H1 + H2)

**Audit Date:** 2026-09-13  
**Auditor Role:** Principal Architect, Senior Backend Engineer, Security Engineer, Database Engineer, Adversarial Auditor  
**Workspace:** `D:\FOAI_PROJECT`  
**Current Sprint:** S12B — Candidate Retrieval & Semantic Alignment Foundation  
**Audit Target:** Pre-Hardening Baseline Verification & Architectural Gap Analysis (H1 + H2)  

---

## 1. Verified Actual Pre-Change Baseline

| Metric | Reported State | Actual Code/Test State | Status / Command | Discrepancy |
|---|:---:|:---:|:---:|:---:|
| **Candidate Retrieval Tests** | 87 passed | **87 passed** | `npx vitest run test/unit/candidate-retrieval` (4 files, 3.41s) | None |
| **Semantic Contract Tests** | 29 passed | **29 passed** | `npx vitest run test/unit/semantic` (1 file, 1.53s) | None |
| **Full Backend Tests** | 435 passed | **435 passed** | `npx vitest run` (81 files, 27.60s) | None |
| **TypeScript Compilation** | 0 errors | **0 errors** | `npx tsc --noEmit` (clean stdout/stderr) | None |
| **Prisma Migration Status** | 1 migration, up to date | **1 migration, up to date** | `npx prisma migrate status` (0 drift) | None |
| **Frozen V1 Semantic Core** | Frozen | **100% UNTOUCHED** | Zero edits to `semantic-registry.service.ts` or contracts | None |
| **RuleEngineService Isolation** | Isolated | **VERIFIED BY SPY** | Spy confirms 0 calls to `evaluateRule` | None |
| **ContextEngineService Status** | Untouched | **100% UNTOUCHED** | Zero integration in S12B (GAP-RET-002) | None |

---

## 2. Architectural Analysis of Issue H1: Citizen Fact Trust Boundary

### Current Actual State:
In `CandidateRetrievalController`:
```typescript
let effectiveFacts = { ...validRequest.citizenContext.facts };
const effectiveUserId = user?.userId || validRequest.citizenContext.userId;

if (effectiveUserId && this.citizenQueryService) {
  try {
    const authoritativeFacts = await this.citizenQueryService.getStructuredFactsByUserId(effectiveUserId);
    if (authoritativeFacts && Object.keys(authoritativeFacts).length > 0) {
      effectiveFacts = {
        ...effectiveFacts,
        ...authoritativeFacts,
      };
    }
  } catch (err) {}
}
```
And `CandidateRetrievalRequest` defines:
```typescript
export interface CandidateRetrievalRequest {
  citizenContext?: {
    userId?: string;
    facts?: Record<string, unknown>;
  };
  ...
}
```

### Architectural Flaw:
1. When a client passes a registered semantic fact absent from the server profile (e.g. server has no `occupation`, client submits `occupation = BUSINESS_OWNER`), `effectiveFacts` absorbs it.
2. `SemanticAlignmentService.alignCitizenFacts(effectiveFacts)` aligns it into `canonicalFacts['OCCUPATION.CATEGORY'] = 'BUSINESS_OWNER'` and `canonicalAttributesPresent.push('OCCUPATION.CATEGORY')`.
3. Downstream code cannot structurally distinguish an authoritative fact verified from database from an exploratory client retrieval hint!
4. Even though S12B does not evaluate eligibility, passing this merged structure blurs the trust boundary and creates a vulnerability for future S13 integration.

### Target Architecture for H1:
1. **Structural Type Separation**:
   In `CandidateRetrievalRequest`:
   ```typescript
   export interface CandidateRetrievalCitizenContext {
     userId?: string;
     // Server-authoritative facts (strictly populated server-side via CitizenQueryService)
     authoritativeFacts?: Record<string, unknown>;
     // Optional client-supplied exploratory hints (strictly isolated, retrieval-only)
     retrievalHints?: Record<string, unknown>;
   }
   ```
2. **Explicit Data Flow & Separation**:
   - `authoritativeFacts` are resolved server-side from `CitizenQueryService`.
   - `retrievalHints` are strictly segregated from authoritative facts.
   - `SemanticAlignmentService` aligns authoritative facts into `canonicalFacts` and `authoritativeAttributesPresent`.
   - Retrieval hints are aligned separately into `exploratoryHints` and marked as non-authoritative.
   - Authoritative facts can never be overridden by hints.
   - Client hints NEVER enter `canonicalFacts`.
   - S13 firewall: S13 eligibility reasoning receives ONLY authoritative facts.

---

## 3. Architectural Analysis of Issue H2: True Hybrid Candidate Retrieval

### Current Actual State:
In `CandidateRetrievalService.retrieveCandidates`:
```typescript
rawPolicies = await this.repository.findStructuredCandidates(...);
...
if (mode === 'HYBRID') {
  const versionIds = rawPolicies.map((p) => p.policyVersionId);
  ...
  vectorMatches = await this.vectorProvider.searchSimilarChunks(queryVector, {
    limit: maxCandidates * 3,
    minScore: request.constraints?.minScore ?? 0.1,
    versionFilter: versionIds.length > 0 ? versionIds : undefined, // <-- CONSTRAINED TO STRUCTURED CANDIDATES!
  });
}
```

### Architectural Flaw:
- Vector search is executed with `versionFilter: versionIds`, where `versionIds` are strictly the IDs returned by structured candidate retrieval!
- This is a **pure reranker**, NOT true hybrid retrieval.
- If Policy B was excluded from structured candidates (e.g. state filter mismatch, department mismatch, or attribute mismatch), vector retrieval can NEVER discover Policy B, even if Policy B has a 99% vector similarity match with the search query!

### Target Architecture for H2:
1. **Independent Channel Execution**:
   - Channel 1: `findStructuredCandidates(criteria)` executes structured filtering.
   - Channel 2: `searchSimilarChunks(queryVector, { limit, minScore, ... })` executes independent vector retrieval across the active policy version corpus without restricting `versionFilter` to structured candidate IDs!
2. **Candidate Union & Resolution**:
   - Candidates discovered by vector search that are not in the structured candidate set are looked up and validated for active status.
   - Candidate set is the union of structured candidates and vector candidates.
   - Candidates are tagged with exact `retrievalMethod`:
     - `STRUCTURED`: Found only by structured channel.
     - `VECTOR`: Found only by independent vector channel.
     - `HYBRID`: Found by both channels.
3. **Truthful Evidence**:
   - For `VECTOR` candidates, structured-specific match flags remain `undefined` (never fabricated).
   - For `STRUCTURED` candidates, vector score remains `undefined`.
   - For `HYBRID` candidates, both evidence dimensions are populated and fused deterministically.
4. **Mandatory Proof Test**:
   - Structured returns Policy A.
   - Vector returns Policy B.
   - Result in HYBRID mode returns Policy B as a `VECTOR` candidate, proving true independent discovery outside the structured set.

---

## 4. Discrepancies & Stale Documentation Identified

1. **Working-Set Scalability**: `totalCandidates` reflects the bounded retrieval working set (`take: limit * 3`), not an unbound corpus count. Documented honestly under `GAP-RET-003`.
2. **Production Vector Persistence**: `pgvector` persistence remains deferred as `GAP-RET-001`.
3. **S13 Integration**: ContextEngine integration remains deferred as `GAP-RET-002`.

---

## 5. Execution Plan for H1 + H2 Hardening

1. **H1 Refactoring**:
   - Update `CandidateRetrievalRequest` interface and Zod schema in `packages/shared` to structurally separate `authoritativeFacts` and `retrievalHints`.
   - Update `CandidateRetrievalController` to populate `authoritativeFacts` strictly from `CitizenQueryService` and map client facts to `retrievalHints`.
   - Update `SemanticAlignmentService` to maintain distinct `canonicalFacts` (authoritative only) and `retrievalHints` (exploratory only).
   - Add adversarial tests H1-01 through H1-15.
2. **H2 Refactoring**:
   - Refactor `IVectorSearchProvider` and `DeterministicVectorTestAdapter` to support independent corpus search without requiring candidate `versionFilter`.
   - Update `CandidateRetrievalService` to execute structured retrieval and vector retrieval in parallel / independently.
   - Implement candidate union, PolicyVersion resolution for vector-only candidates, and truthful `retrievalMethod` tagging (`STRUCTURED`, `VECTOR`, `HYBRID`).
   - Add adversarial tests H2-01 through H2-20, including the mandatory test proving recovery of a policy excluded from structured retrieval.
3. **Re-run Full Verifications & Reconcile All Documentation**.
