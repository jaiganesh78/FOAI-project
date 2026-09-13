# V1 Semantic Freeze Integrity Audit (Step 4R.1)

**Audit Date**: 2026-09-12  
**Role**: Principal Software Architect + Domain-Model Auditor + Deterministic Rules-Engine Reviewer  
**Repository**: `D:\FOAI_PROJECT`  
**Target Platform**: Government Policy Intelligence Operating System (GPIOS)  
**Governing Principle**: *Evidence beats documentation. Documentation must describe reality, never the other way around.*

---

## 1. Executive Summary

This audit is the non-negotiable integrity gate for Step 4R.1 before the V1 Semantic Contract is permanently frozen. The audit inspects the actual TypeScript codebase, database schemas, runtime execution paths, and Vitest test suites, evaluating reality against theoretical claims.

### Summary of Audit Classifications:
- **VERIFIED**: 7 areas (`Canonical Code Syntax`, `Land Area vs Ownership`, `Social Category vs EWS`, `Regional Unit Rejection`, `Transport vs Semantic Validation`, `Zero-AI Boundary`, `Downstream Gap Tracking`)
- **PARTIALLY VERIFIED**: 2 areas (`Numerical Determinism`, `Fact Verification Integration`)
- **NEEDS REMEDIATION**: 3 areas (`Contextual Alias Contradiction`, `Legacy Key Invariant Codification`, `Replay/Versioning Documentation Claims`)
- **INCORRECT**: 0 areas (Previous Step 4R remediations successfully eliminated core conflations, but architectural contradictions in alias resolution and documentation remain)

---

## 2. Evidence-Based Audit Findings

### Finding AUD-01: Contextual Alias Contradiction in Context-Free Runtime Resolver
- **Finding ID**: `AUD-01`
- **Area**: `SemanticRegistryService.resolveCanonicalValue` & Alias Registry
- **Classification**: `NEEDS REMEDIATION`
- **Actual Implementation**:
  - `SemanticRegistryService.resolveCanonicalValue(attributeCodeOrKey: string, rawValue: unknown)` receives only the attribute code and raw value (`apps/backend/src/core/semantic/semantic-registry.service.ts` line 387).
  - It receives **NO** scheme, jurisdiction, occupation context, question context, document context, or policy context.
  - However, the registry registers several aliases classified as `CONTEXTUAL_ALIAS`:
    - `"farmer"` → `CULTIVATOR` (`scope: 'Citizen declaration synonym in rural schemes'`)
    - `"agricultural worker"` → `AGRICULTURAL_LABOURER` (`scope: 'Wage labour descriptor'`)
    - `"government employee"` → `SALARIED_EMPLOYEE` (`scope: 'Salaried public sector employee'`)
    - `"private job"` → `SALARIED_EMPLOYEE` (`scope: 'Colloquial phrase for salaried private employment'`)
    - `"shopkeeper"` → `SELF_EMPLOYED` (`scope: 'Micro-enterprise / independent trade descriptor'`)
  - Because `resolveCanonicalValue` has no context parameters, it resolves all of these aliases blindly and identically to exact lexical aliases.
- **Expected Contract**:
  - The V1 semantic contract states that contextual aliases are permitted only where context is unambiguous.
  - If the runtime resolver receives zero context, it cannot legitimately claim to perform contextual disambiguation.
  - V1 runtime aliases must be context-free and deterministic. Aliases requiring contextual inference must not resolve automatically.
- **Evidence**:
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 242–257, 431–444.
  - `packages/shared/src/interfaces/semantic.interface.ts` line 32 (`SemanticAliasType`).
- **Risk**: In a general scheme or census context, an agricultural laborer declaring "farmer" or "agricultural worker" would be incorrectly forced into `CULTIVATOR` or `AGRICULTURAL_LABOURER`. A contractual worker declaring "private job" or "government employee" would be forced into `SALARIED_EMPLOYEE`.
- **Required Action**:
  - Codify that V1 runtime alias resolution is strictly context-free and deterministic.
  - Designate aliases requiring external context (`farmer`, `agricultural worker`, `government employee`, `private job`, `shopkeeper`) as `REQUIRES_CONTEXT`.
  - In `resolveCanonicalValue`, reject contextual aliases with `resolved: false` and stable reason `CONTEXT_REQUIRED` (or `AMBIGUOUS_ALIAS`), preventing automated semantic inference.
  - Retain only genuinely unambiguous lexical aliases (`cultivator`, `kisan`, `krishak`, `agricultural labourer`, `agricultural laborer`, `farm labourer`, `farm laborer`, `salaried employee`, `salaried`, `business owner`, `enterprise owner`) as safe deterministic aliases (`SAFE_DETERMINISTIC_ALIAS` / `EXACT_LEXICAL_ALIAS`).

---

### Finding AUD-02: Explanation of the 344 → 343 Test Count Reduction
- **Finding ID**: `AUD-02`
- **Area**: Vitest Test Suite Progression (`semantic-contract.spec.ts`)
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - Step 4 Initial backend suite had 344 tests (25 tests in `semantic-contract.spec.ts`).
  - Step 4R Remediated backend suite had 343 tests (24 tests in `semantic-contract.spec.ts`).
  - Analysis of the Step 4 Initial test file reveals that two tests were asserting **defective pre-remediation behavior**:
    1. Initial Test 12 (`should convert area units with fixed precision`) asserted that `BIGHA_PUCCA` converted universally to `0.2529 Hectares`.
    2. Initial Test 8 (`should resolve registered synonyms to their exact canonical value`) asserted that generic `"business"` resolved to `BUSINESS_OWNER`.
    3. Initial Test 7 asserted that `CanonicalCasteCategory` contained `EWS`.
  - In Step 4R:
    - The defective tests were removed and replaced with stricter adversarial tests:
      - `should strictly reject regional land units (e.g. BIGHA) lacking jurisdictional context`
      - `should resolve explicit business owner phrases but reject ambiguous generic "business"`
      - `should reject EWS when submitted as a social category`
      - `should provide a dedicated canonical attribute for ECONOMIC.EWS_STATUS`
    - Five basic Step 4 initial tests (`resolve identical metadata`, `return null for unknown`, `maintain version = 1`, `min/max boundaries`, `Aadhaar regex`) were consolidated into the structured R1 and R9 tests.
    - Five new adversarial tests were introduced (boundary testing with epsilons, converted-unit boundaries, `NaN`/`Infinity`/negative number rejection, transport vs semantic validation, `isLandOwner` non-fallback).
  - The net test count in `semantic-contract.spec.ts` was 24 instead of 25 due to test consolidation, while test assertions became significantly more rigorous.
- **Expected Contract**: Every reduction in test count must be transparently audited, documented, and proven to increase (rather than decrease) semantic rigor.
- **Evidence**:
  - `transcript_full.jsonl` step 6308 vs step 6379 test manifests.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 1–454.
- **Risk**: Unexplained test count drop creates suspicion of silent coverage loss or test deletion.
- **Required Action**: Formally record this reconciliation in `Architecture.md` and verification documents.

---

### Finding AUD-03: Canonical Domain Count vs. Code Namespace Discrepancy
- **Finding ID**: `AUD-03`
- **Area**: Semantic Registry Domain Architecture
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - `Architecture.md` states: *"11 canonical attributes across 7 domains"*.
  - `SemanticRegistryService.RECOGNIZED_NAMESPACES` lists **8 top-level namespaces**:
    `AGRICULTURE`, `FINANCIAL`, `OCCUPATION`, `DEMOGRAPHICS`, `COMMUNITY`, `ECONOMIC`, `IDENTITY`, `DISABILITY`.
  - In `SemanticRegistryService.initializeRegistry()`:
    - `ECONOMIC.EWS_STATUS` uses code namespace `ECONOMIC.*`, but its metadata domain field is `domain: FactCategory.FINANCIAL` (because the Prisma/shared `FactCategory` enum contains `FINANCIAL` but lacks an `ECONOMIC` category).
    - `IDENTITY.*` uses code namespace `IDENTITY.*`, but its metadata domain field is `domain: FactCategory.GOVERNMENT_IDENTIFIER`.
  - The 11 attributes map to **7 distinct `FactCategory` domains**:
    1. `FactCategory.AGRICULTURE` (2 attributes: `LAND_AREA`, `LAND_OWNERSHIP_STATUS`)
    2. `FactCategory.FINANCIAL` (2 attributes: `ANNUAL_INCOME`, `ECONOMIC.EWS_STATUS`)
    3. `FactCategory.OCCUPATION` (1 attribute: `OCCUPATION.CATEGORY`)
    4. `FactCategory.DEMOGRAPHICS` (2 attributes: `DATE_OF_BIRTH`, `GENDER`)
    5. `FactCategory.COMMUNITY` (1 attribute: `SOCIAL_CATEGORY`)
    6. `FactCategory.GOVERNMENT_IDENTIFIER` (2 attributes: `AADHAAR_NUMBER`, `BANK_ACCOUNT_NUMBER`)
    7. `FactCategory.DISABILITY` (1 attribute: `BENCHMARK_STATUS`)
- **Expected Contract**: Documentation and code must distinguish between **syntactic dot-notation namespaces** (8 namespaces) and **underlying domain classifications** (`FactCategory`, 7 domains).
- **Evidence**:
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 22–31, 80–215.
  - `packages/shared/src/enums/citizen-fact-category.enum.ts` lines 1–16.
- **Risk**: Confusion during audits as to whether an attribute or domain was missed or miscounted.
- **Required Action**: Clarify documentation to state: *"11 canonical attributes across 8 syntactic namespaces mapped to 7 underlying FactCategory domains"*.

---

### Finding AUD-04: Legacy Attribute Key Single vs. Plural Model
- **Finding ID**: `AUD-04`
- **Area**: `CanonicalSemanticAttribute.legacyAttributeKey` vs `legacyAttributeKeys`
- **Classification**: `NEEDS REMEDIATION`
- **Actual Implementation**:
  - `CanonicalSemanticAttribute` interface defines both `legacyAttributeKey: string` and `legacyAttributeKeys: string[]`.
  - In `semantic-registry.service.ts`, every single attribute initializes `legacyAttributeKey` as the first element of `legacyAttributeKeys`.
  - In `rule-engine.service.ts`, lookups iterate over `canonicalAttr.legacyAttributeKeys`.
- **Expected Contract**:
  - There must be a single authoritative source of truth.
  - `legacyAttributeKeys: string[]` is authoritative.
  - `legacyAttributeKey: string` is a deprecated, read-only compatibility alias guaranteed to equal `legacyAttributeKeys[0]`.
- **Evidence**:
  - `packages/shared/src/interfaces/semantic.interface.ts` lines 22–25.
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 80–215.
- **Risk**: Downstream consumers might read `legacyAttributeKey` and miss secondary legacy keys such as `landHolding` or `ewsStatus`.
- **Required Action**:
  - Add JSDoc marking `legacyAttributeKey` as `@deprecated`.
  - Add invariant test verifying `legacyAttributeKey === legacyAttributeKeys[0]` for all registered attributes.

---

### Finding AUD-05: Land Area vs. Ownership Independence
- **Finding ID**: `AUD-05`
- **Area**: `AGRICULTURE.LAND_AREA` vs `AGRICULTURE.LAND_OWNERSHIP_STATUS`
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - `AGRICULTURE.LAND_AREA` is `dataType: NUMBER`, unit `HECTARE`, legacy keys `['landAreaHectares', 'landHolding']`.
  - `AGRICULTURE.LAND_OWNERSHIP_STATUS` is `dataType: BOOLEAN`, unit `null`, legacy keys `['isLandOwner']`.
  - `RuleEngineService` removed the fallback from land area to `isLandOwner`.
- **Expected Contract**:
  - `isLandOwner: true` must never satisfy a land area condition.
  - `landAreaHectares: 2.0` must never satisfy an ownership status condition without an explicit policy rule.
- **Evidence**:
  - `apps/backend/src/modules/eligibility/services/rule-engine.service.ts` lines 96–116.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 363–393.
- **Risk**: Low. Existing tests verify the forward direction.
- **Required Action**: Add an explicit test verifying the reverse direction: a citizen fact with only `landAreaHectares` (and no `isLandOwner`) fails an `AGRICULTURE.LAND_OWNERSHIP_STATUS` condition.

---

### Finding AUD-06: Social Category vs. EWS Independence
- **Finding ID**: `AUD-06`
- **Area**: `COMMUNITY.SOCIAL_CATEGORY` vs `ECONOMIC.EWS_STATUS`
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - `CanonicalSocialCategory` contains only `GENERAL`, `OBC`, `SC`, `ST`. `EWS` is completely absent.
  - `ECONOMIC.EWS_STATUS` is a distinct `BOOLEAN` attribute (`isEws`, `ewsStatus`).
- **Expected Contract**:
  - EWS must not be an affirmative action caste category.
  - Affirmative action categories must not resolve into EWS status.
- **Evidence**:
  - `packages/shared/src/enums/semantic.enum.ts` lines 55–60.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 142–169.
- **Risk**: Low.
- **Required Action**: Add explicit tests proving that caste strings (`GENERAL`, `OBC`, etc.) fail `ECONOMIC.EWS_STATUS` resolution and vice versa.

---

### Finding AUD-07: Regional Land Unit Rejection
- **Finding ID**: `AUD-07`
- **Area**: `SemanticRegistryService.convertUnit`
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - `regionalUnitsRequiringJurisdiction` contains `BIGHA_REGIONAL`, `BIGHA`, `BIGHA_PUCCA`, `BIGHA_KACCHA`, `GUNTHA`, `KATTHA`, `MARLA`, `KANAL`, `BISWA`.
  - Any conversion involving these units immediately fails with an error requiring explicit jurisdiction context.
- **Expected Contract**: Non-standard regional cadastral units must never have hardcoded national conversion multipliers in V1.
- **Evidence**:
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 63–73, 538–545.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 190–202.
- **Risk**: Low.
- **Required Action**: Extend test coverage to explicitly assert rejection for `BIGHA`, `KATTHA`, and `MARLA`.

---

### Finding AUD-08: Numerical Determinism & Finite Number Guards
- **Finding ID**: `AUD-08`
- **Area**: `RuleEngineService.applyOperator` & `SemanticRegistryService.convertUnit`
- **Classification**: `PARTIALLY VERIFIED`
- **Actual Implementation**:
  - `convertUnit` rounds area to 6 decimal places and currency to 2 decimal places.
  - `convertUnit` rejects `NaN`, `Infinity`, `-Infinity`, and values `> 1e12`.
  - In `RuleEngineService.applyOperator`:
    - Numeric operators check `if (isNaN(a) || isNaN(e)) return false;`.
    - However, `isFinite(a)` is not checked in `applyOperator`. In JavaScript, `Infinity >= 100` evaluates to `true`!
- **Expected Contract**:
  - Eligibility engine must compare finite canonical numbers only.
  - `NaN`, `Infinity`, and `-Infinity` must fail numeric rule conditions.
- **Evidence**:
  - `apps/backend/src/modules/eligibility/services/rule-engine.service.ts` lines 178–200.
- **Risk**: If an unvalidated fact containing `Infinity` bypasses transport, it could pass `GREATER_THAN` or `GREATER_OR_EQUAL` conditions.
- **Required Action**: Add `!isFinite(a) || !isFinite(e)` checks to `GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`, and `BETWEEN` operators in `RuleEngineService`.

---

### Finding AUD-09: Runtime Canonical Code Format & Namespace Validation
- **Finding ID**: `AUD-09`
- **Area**: `SemanticRegistryService.validateCanonicalCode`
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - Validates non-empty string, no leading/trailing whitespace.
  - Enforces uppercase regex `/^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]+(?:\.[A-Z][A-Z0-9_]+)?$/`.
  - Enforces recognized namespace check against `RECOGNIZED_NAMESPACES`.
  - Enforces registry membership check.
- **Expected Contract**: Rejects unknown, malformed, empty, lowercase, or unsupported canonical codes.
- **Evidence**:
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 306–330.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 58–75.
- **Risk**: Low.
- **Required Action**: Add adversarial tests for `AGRICULTURE.UNKNOWN`, `LAND_AREA`, `land_area`, `null`, `undefined`.

---

### Finding AUD-10: Transport Envelope vs. Semantic Validation Boundary
- **Finding ID**: `AUD-10`
- **Area**: Zod Schemas vs `SemanticRegistryService.validateAttributeValue`
- **Classification**: `VERIFIED`
- **Actual Implementation**:
  - Zod schemas use `rawValue: z.any()` for transport ingestion.
  - `validateAttributeValue` rigorously enforces data type rules, numeric min/max, finite checks, enum allowed values, regex patterns, and string length bounds.
- **Expected Contract**: Transport permits any envelope payload; semantic registry enforces absolute domain truth.
- **Evidence**:
  - `packages/shared/src/schemas/semantic.schema.ts` lines 3–13.
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 592–660.
  - `apps/backend/test/unit/semantic/semantic-contract.spec.ts` lines 312–326.
- **Risk**: Low.
- **Required Action**: Add test asserting that passing an object to an enum attribute or a non-numeric string to a number attribute fails semantic validation despite passing transport validation.

---

### Finding AUD-11: Versioning & Historical Replay Reproducibility Boundary
- **Finding ID**: `AUD-11`
- **Area**: Versioning Hierarchy & Replay Engine
- **Classification**: `NEEDS REMEDIATION (DOCUMENTATION / TRUTHFUL BOUNDARY)`
- **Actual Implementation**:
  - V1 semantic definitions are code-managed in TypeScript (`contractVersion: 1`).
  - There is no database table storing historical snapshots of semantic alias dictionaries or unit conversion multipliers.
  - `DecisionReplayService` checks stored `snapshot.status === trace.status` (audit record verification).
  - If dynamic re-evaluation is performed, `RuleEngineService` invokes the current singleton `SemanticRegistryService`.
- **Expected Contract / Thought Experiment**:
  - If an alias definition in code were modified from version A to version B in the future, a dynamic re-evaluation of past facts would use version B.
  - Nothing in the V1 runtime prevents code updates from affecting dynamic historical re-evaluations.
- **Evidence**:
  - `apps/backend/src/modules/eligibility/services/decision-replay.service.ts` lines 22–42.
  - `apps/backend/src/core/semantic/semantic-registry.service.ts` lines 18–77.
- **Risk**: Misrepresenting V1 as having full temporal time-travel semantic versioning when it is actually an immutable code-managed registry.
- **Required Action**: Truthfully document this architectural boundary: V1 guarantees historical audit reproducibility via stored decision traces and frozen immutable code releases; dynamic temporal time-travel across semantic definition revisions is an explicit V2 roadmap item.

---

### Finding AUD-12: Downstream System Integration Reality
- **Finding ID**: `AUD-12`
- **Area**: Onboarding, Document, Fact Verification, Recommendation, Journey
- **Classification**: `VERIFIED (GAPS HONESTLY TRACKED)`
- **Actual Implementation**:
  - **Onboarding (`QuestionCatalog`)**: Uses static seed definitions in Prisma. Does not dynamically pull options from `SemanticRegistryService`. **Status: `PLANNED (GAP-SEM-001)`**.
  - **Document Intelligence (`ConflictDetectionService`)**: Compares raw string equality (`String(declared) !== String(extracted.extractedValue)`). Does not normalize units or aliases prior to conflict checks. **Status: `CONTRACT TARGET (GAP-SEM-002)`**.
  - **Fact Verification (`FactVerificationImpactEngineService`)**: Uses hardcoded legacy keys (`annualIncome`, `isLandOwner`, `casteCategory`). **Status: `PARTIALLY VERIFIED`** (legacy keys match registered bridge).
  - **Recommendation (`RecommendationUtilityService`)**: Directly references raw legacy keys (`citizenFacts.landHolding`). **Status: `CONTRACT ONLY / PLANNED`**.
  - **Application Journey (`JourneyReadinessService`, `ChecklistGenerationService`)**: Directly references raw legacy keys (`citizenFacts.landHolding`). **Status: `CONTRACT ONLY / PLANNED`**.
- **Expected Contract**: Never claim downstream integration is implemented when only contracts or legacy bridges exist.
- **Evidence**:
  - `apps/backend/src/modules/document/services/conflict-detection.service.ts` line 19.
  - `apps/backend/src/modules/fact-verification/services/fact-verification-impact-engine.service.ts` line 22.
  - `apps/backend/src/modules/recommendation/services/recommendation-utility.service.ts` line 22.
  - `apps/backend/src/modules/application-journey/services/journey-readiness.service.ts` line 15.
- **Risk**: False sense of completed integration across the platform.
- **Required Action**: Update all documentation to clearly demarcate downstream status as `VERIFIED`, `PARTIALLY VERIFIED`, `CONTRACT ONLY`, or `PLANNED`.

---

## 3. Pre-Remediation Verification Matrix

| Area | Current Implementation State | Audit Classification |
|---|---|---|
| Contextual Aliases | Resolves contextual aliases without context | `NEEDS REMEDIATION` |
| 344 → 343 Test Delta | Consolidation of defective tests documented | `VERIFIED` |
| Domain Count | 8 Code Namespaces / 7 FactCategory Domains | `VERIFIED` |
| Legacy Key Model | `legacyAttributeKey` = `legacyAttributeKeys[0]` | `NEEDS REMEDIATION` (add invariant test) |
| Land Area vs Ownership | Separated in code and rule engine | `VERIFIED` |
| Social Category vs EWS | Separated in code and enums | `VERIFIED` |
| Regional Units | Rejection enforced for all regional units | `VERIFIED` |
| Numerical Determinism | Rounding fixed; finite checks needed in rule engine | `PARTIALLY VERIFIED` |
| Runtime Code Validation | Strict regex and namespace checks | `VERIFIED` |
| Transport vs Semantic | Transport envelope loose, semantic strict | `VERIFIED` |
| Versioning & Replay | Code-managed; time-travel replay is V2 | `NEEDS REMEDIATION` (doc boundary) |
| Downstream Modules | Legacy keys bridged; direct bindings planned | `VERIFIED (TRACKED)` |
