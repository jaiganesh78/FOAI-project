# V1 Semantic Contract Remediation Audit (Step 4R)

**Audit Date**: 2026-09-12  
**Auditor**: Antigravity / Senior Principal Production Systems Auditor  
**Repository**: `D:\FOAI_PROJECT`  
**Scope**: Codebase audit of Step 4 V1 Semantic Layer, `@gpios/shared`, and cross-module integration points.  
**Mandate**: Surgical correctness pass before permanent V1 freeze. No V2 ontology scope creep.

---

## Executive Summary

Step 4 established the foundational code-first V1 Semantic Contract and achieved passing test baselines (77 files, 344 tests). However, an in-depth correctness audit revealed critical semantic conflations, alias overreach, regional unit invalidity, and documentation overclaims that must be remediated:
1. **Semantic Conflation of Land Area & Ownership** (`INCORRECT / NEEDS REMEDIATION`): `isLandOwner` was mapped to `AGRICULTURE.LAND_AREA`, equating a boolean land ownership declaration with a continuous area measurement in hectares.
2. **Caste vs. Economic Criterion Conflation** (`INCORRECT / NEEDS REMEDIATION`): `EWS` (Economically Weaker Section) was categorized as an enum value under `CanonicalCasteCategory`, which violates Indian constitutional and domain reality.
3. **Alias Overreach & Semantic Inference** (`NEEDS REMEDIATION`): Generic words like `"business"` were mapped to `BUSINESS_OWNER`, ignoring that working in a business does not mean owning one.
4. **Regional Land Unit Universalization** (`INCORRECT / NEEDS REMEDIATION`): `BIGHA_PUCCA` was hardcoded to `0.2529 Hectares` as a universal constant, despite regional land units having non-standard, jurisdiction-dependent definitions across Indian states.
5. **Numerical Boundary & Floating Point Precision** (`PARTIALLY VERIFIED / NEEDS REMEDIATION`): Strict boundary and epsilon behavior (`threshold - epsilon`, `threshold`, `threshold + epsilon`, NaN, Infinity) was not comprehensively tested.
6. **Documentation Overclaims** (`INCORRECT / NEEDS REMEDIATION`): Integration claims regarding Document OCR canonicalization and Onboarding question binding were documented as implemented when they remain tracked integration gaps.

---

## 1. Current V1 Semantic Architecture

- **State**: Code-managed, immutable registry residing in `@gpios/shared` (types/enums/DTOs/schemas) and `apps/backend/src/core/semantic/` (`SemanticRegistryService`, `PolicyDerivedClassificationService`, `SemanticModule`).
- **Classification**: `VERIFIED`
- **Details**:
  - The registry is code-governed, synchronous, and purely deterministic.
  - Zero database migrations were introduced, avoiding schema churn.
  - Registered globally in `AppModule` with injection tokens `SEMANTIC_REGISTRY_SERVICE` and `POLICY_DERIVED_CLASSIFICATION_SERVICE`.

---

## 2. Existing Canonical Attributes

- **State**: 9 canonical attributes originally registered under `CanonicalSemanticAttributeCode`.
- **Classification**: `NEEDS REMEDIATION`
- **Findings**:
  - `AGRICULTURE.LAND_AREA`: Registered with legacy key `landAreaHectares` (`NUMBER`, `HECTARE`).
  - `FINANCIAL.ANNUAL_INCOME`: Registered with legacy key `annualIncome` (`NUMBER`, `INR`).
  - `OCCUPATION.CATEGORY`: Registered with legacy key `occupationCategory` (`ENUM`).
  - `DEMOGRAPHICS.DATE_OF_BIRTH`: Registered with legacy key `dob` (`DATE`).
  - `DEMOGRAPHICS.GENDER`: Registered with legacy key `gender` (`ENUM`).
  - `COMMUNITY.CASTE_CATEGORY`: Conflates caste and economic criteria (contains `EWS`).
  - `IDENTITY.AADHAAR_NUMBER`: Registered (`TEXT`, regex).
  - `IDENTITY.BANK_ACCOUNT_NUMBER`: Registered (`TEXT`, min/max).
  - `DISABILITY.BENCHMARK_STATUS`: Registered (`BOOLEAN`).
  - **Defect**: Missing dedicated `AGRICULTURE.LAND_OWNERSHIP_STATUS` (boolean), leading to the conflation of `isLandOwner` with `AGRICULTURE.LAND_AREA`. Missing separation of `ECONOMIC.EWS_STATUS`.

---

## 3. Existing Controlled Values

- **State**: Enums defined in `packages/shared/src/enums/semantic.enum.ts`.
- **Classification**: `NEEDS REMEDIATION`
- **Findings**:
  - `CanonicalOccupationCategory`: `[CULTIVATOR, AGRICULTURAL_LABOURER, SALARIED_EMPLOYEE, SELF_EMPLOYED, BUSINESS_OWNER, STUDENT, UNEMPLOYED, RETIRED]`. Valid.
  - `CanonicalGender`: `[MALE, FEMALE, TRANSGENDER, OTHER]`. Valid.
  - `CanonicalCasteCategory`: `[GENERAL, OBC, SC, ST, EWS]`. **INCORRECT**. `EWS` is an economic status, not a social/caste category.

---

## 4. Existing Aliases

- **State**: Registered in `SemanticRegistryService` initialized alias registry.
- **Classification**: `NEEDS REMEDIATION`
- **Findings**:
  - `OCCUPATION.CATEGORY`:
    - `"farmer"` → `CULTIVATOR` (`CONTEXTUAL_ALIAS`, acceptable under controlled rural scheme context).
    - `"cultivator"` → `CULTIVATOR` (`EXACT_LEXICAL_ALIAS`).
    - `"kisan"`, `"krishak"` → `CULTIVATOR` (`EXACT_LEXICAL_ALIAS`).
    - `"agricultural worker"`, `"farm labourer"` → `AGRICULTURAL_LABOURER` (`EXACT_LEXICAL_ALIAS`).
    - `"salaried"`, `"government employee"`, `"private job"` → `SALARIED_EMPLOYEE` (`CONTEXTUAL_ALIAS`).
    - `"business"` → `BUSINESS_OWNER` (**INFERENCE / UNSAFE**). An employee at a private business may declare "business". Must be removed.
    - `"shopkeeper"` → `SELF_EMPLOYED` (`CONTEXTUAL_ALIAS`, acceptable for micro-retailers).

---

## 5. Existing Unit Conversions

- **State**: Multipliers defined in `SemanticRegistryService`.
- **Classification**: `NEEDS REMEDIATION`
- **Findings**:
  - `HECTARE`: `1.0` (Base) (`VERIFIED`).
  - `ACRE`: `0.404686` (`VERIFIED`).
  - `SQ_METER`: `0.0001` (`VERIFIED`).
  - `CENT`: `0.004047` (`VERIFIED`).
  - `BIGHA_PUCCA`: `0.2529` (**INCORRECT / UNSAFE**). Bigha is not standard across India. Without state/district jurisdiction, hardcoding 0.2529 causes incorrect eligibility determinations. Must be removed from universal deterministic conversions.
  - Currency: `INR` (1.0), `LAKH` (1e5), `CRORE` (1e7), `THOUSAND` (1e3) (`VERIFIED`).

---

## 6. Existing Legacy-Key Mappings

- **State**: Single `legacyAttributeKey: string` on attribute, plus supplementary map in `SemanticRegistryService`.
- **Classification**: `NEEDS REMEDIATION`
- **Findings**:
  - `CanonicalSemanticAttribute` currently defines `legacyAttributeKey: string`. A canonical attribute often has multiple legitimate legacy aliases (e.g. `landAreaHectares` and `landHolding` both represent land area).
  - `isLandOwner` was mapped to `AGRICULTURE.LAND_AREA` in `SemanticRegistryService.legacyKeyToCanonicalCode` and in `RuleEngineService`. This was fundamentally incorrect.

---

## 7. Existing Policy-Rule Integration

- **State**: Implemented in `apps/backend/src/modules/eligibility/services/rule-engine.service.ts`.
- **Classification**: `PARTIALLY VERIFIED / NEEDS REMEDIATION`
- **Findings**:
  - Rule condition evaluation resolves canonical attributes and legacy keys.
  - Supports unit extraction from `{ value, unit }` structured objects.
  - Performs unit conversion if `expectedUnit` or canonical unit differs from actual unit.
  - Resolves registered aliases for controlled enums.
  - **Defect**: Fallback logic checked `facts['isLandOwner']` when evaluating `AGRICULTURE.LAND_AREA`. Must be removed.
  - Multi-legacy-key resolution must be formally supported in the attribute contract (`legacyAttributeKeys: string[]`).

---

## 8. Existing Onboarding Integration

- **State**: Contract requirement defined, but runtime binding not implemented.
- **Classification**: `PARTIALLY VERIFIED / NEEDS REMEDIATION`
- **Findings**:
  - `QuestionCatalog` options are statically defined in `citizen-knowledge.seed.ts` and not dynamically pulled from `SemanticRegistryService.getControlledValues()`.
  - Step 4 documentation correctly noted `GAP-SEM-001`, but text elsewhere claimed full integration.

---

## 9. Existing Document Integration

- **State**: Contract target defined.
- **Classification**: `NOT VERIFIED / CONTRACT ONLY`
- **Findings**:
  - `ConflictDetectionService` in Document module compares raw strings and does not currently invoke `SemanticRegistryService`.
  - Must be explicitly documented as `CONTRACT TARGET / NOT YET IMPLEMENTED` rather than implemented.

---

## 10. Existing Fact-Verification Integration

- **State**: Hardcoded strings in `fact-verification-impact-engine.service.ts`.
- **Classification**: `PARTIALLY VERIFIED / NEEDS REMEDIATION`
- **Findings**:
  - `impact-engine.service.ts` lists `['annualIncome', 'isLandOwner', 'residenceState', 'casteCategory']`.
  - Shows that `isLandOwner` is treated as a critical eligibility fact distinct from `landAreaHectares`.

---

## 11. Existing Versioning Mechanism

- **State**: Static `contractVersion: 1` on attributes and aliases.
- **Classification**: `VERIFIED`
- **Findings**:
  - Sufficient for V1 code-managed registry.
  - Must clearly distinguish Semantic Contract Version (v1) from Semantic Definition Revision, Policy Version, and Rule Version.

---

## 12. Existing Tests

- **State**: 25 tests in `apps/backend/test/unit/semantic/semantic-contract.spec.ts`.
- **Classification**: `PARTIALLY VERIFIED / NEEDS REMEDIATION`
- **Findings**:
  - Tests verified basic alias resolution, unit conversion, rule engine execution, and derived classification isolation.
  - Missing tests:
    - Proof that `LAND_AREA` != `LAND_OWNERSHIP_STATUS`.
    - Proof that `SOCIAL_CATEGORY` != `EWS_STATUS`.
    - Floating-point threshold epsilon boundary tests (`threshold - epsilon`, `threshold`, `threshold + epsilon`).
    - Adversarial rejection of `"business"`, `"business worker"`, `"I work in business"`.
    - Rejection of regional unit `BIGHA_PUCCA` as universal conversion.
    - Malformed and unknown canonical attribute code rejection.
    - Spy-based proof of Zero-AI calls.

---

## 13. Documentation Inconsistencies

- **State**: Mismatches between implementation reality and narrative docs.
- **Classification**: `INCORRECT / NEEDS REMEDIATION`
- **Findings**:
  - Step 4 report claimed document OCR facts are canonicalized prior to conflict detection. Code inspection proves `ConflictDetectionService` does not yet call `SemanticRegistryService`.
  - `Architecture.md` table claimed 100% backward compatibility without acknowledging that unit-aware comparisons correct previously broken unitless evaluations.

---

## 14. Semantic Correctness Risks

1. **False Eligibility via Conflated Ownership/Area**: Treating `isLandOwner: true` as `landArea = 1` or `landArea = true` causes arithmetic failure or false eligibility in area-threshold schemes.
2. **Discrimination / Legal Inaccuracy via EWS Conflation**: Forcing citizens to pick EWS instead of General/OBC/SC/ST conflates affirmative action categories with income-based quotas.
3. **Misclassification of Business Employees**: Classifying an administrative clerk at a business enterprise as `BUSINESS_OWNER`.
4. **Arbitrary Land Calculations via Regional Bigha**: In UP 1 Pucca Bigha is ~0.253 ha; in Bengal 1 Bigha is ~0.133 ha; in Assam it is ~0.134 ha. Applying a single multiplier causes severe miscalculation of land holding.

---

## 15. Required Remediation Plan

- **R1**: Separate `AGRICULTURE.LAND_AREA` and `AGRICULTURE.LAND_OWNERSHIP_STATUS`. Support `legacyAttributeKeys: string[]`. Remove `isLandOwner` fallback from land area logic.
- **R2**: Remove unsafe alias `"business" → BUSINESS_OWNER`. Add negative adversarial tests for ambiguous business phrases.
- **R3**: Separate `COMMUNITY.SOCIAL_CATEGORY` (containing `GENERAL`, `OBC`, `SC`, `ST`) and `ECONOMIC.EWS_STATUS` (boolean). Maintain backward-compatible legacy key resolution for `casteCategory`.
- **R4**: Remove `BIGHA_PUCCA` from universal deterministic unit conversion. Explicitly mark regional land units as requiring jurisdictional context.
- **R5**: Implement and test deterministic numerical boundaries (`threshold - epsilon`, `threshold`, `threshold + epsilon`, NaN, Infinity, negative values).
- **R6 & R7**: Document registry as code-managed and clarify versioning hierarchy.
- **R8**: Formalize transport envelope validation vs semantic attribute-specific validation.
- **R9**: Add runtime canonical attribute code format & namespace validation.
- **R10**: Clarify policy integration language (representation compatibility vs corrected evaluation).
- **R11 & R12**: Document Onboarding & Document integrations truthfully as Contract Targets / Planned.
- **R13**: Maintain and strengthen `assertNotPolicyDerivedClassification`.
- **R14 & R15**: Add spy-based Zero-AI boundary tests and vector boundary tests.
- **R16**: Reconcile all baseline metrics in `Architecture.md`.

---

## 16. Explicit Non-Goals

The following remain **STRICTLY OUT OF SCOPE** for V1:
- No RDF/OWL or triplestore schemas.
- No graph databases (Neo4j).
- No dynamic subsumption or automated taxonomy reasoning.
- No vector-based canonicalization or embedding similarity proofs.
- No autonomous LLM-based alias generation.
- No multi-jurisdictional automated legal conversion engine.
