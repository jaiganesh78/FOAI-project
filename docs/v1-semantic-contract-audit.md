# V1 Semantic Contract Audit — Existing Architecture & Gap Analysis

**Document Version**: 1.0.0  
**Date**: 2026-09-12  
**Author**: Principal Enterprise & Platform Architect  
**Status**: ACTIVE / ARCHITECTURAL AUDIT  
**Repository**: `D:/FOAI_PROJECT` (`apps/backend`, `packages/shared`)

---

## 1. Executive Summary

This audit performs an empirical, code-level investigation of the semantic capabilities across Sprints 1–12 of the Government Policy Intelligence Operating System (GPIOS).

The primary objective is to evaluate how citizen facts, policy rules, onboarding question answers, document extractions, and eligibility evaluation currently communicate semantically, identify fragmentation and loose string typing, and establish the requirements for a minimal, deterministic, auditable **V1 Semantic Contract**.

### Key Findings
1. **Asymmetric Rigor**: Citizen attributes are strictly governed via `CitizenAttributeRegistry` with database foreign keys, whereas policy rule conditions (`RuleCondition`) use unrestricted free-form strings for `attributeKey` and loose `Json` for `expectedValue`.
2. **Key Fragmentation & Naming Collisions**: Across modules, the identical physical concept is keyed differently:
   - Agricultural land holding is referenced as `landAreaHectares` in Citizen Attribute Registry, `landHolding` in Policy Rules, Recommendation, and Journey, and `isLandOwner` in Fact Verification.
   - Required identity documents (`aadhaarNumber`, `bankAccountNumber`) are hardcoded across Recommendation, Journey, and Fact Verification engines but are completely absent from `CitizenAttributeRegistry`.
3. **Unit Ambiguity**: Measurements (e.g. land area, income) have no first-class unit contract. Citizen storage records raw floats (`landAreaHectares`), while rule conditions perform naive string/number comparisons (`actual > expected`) without unit verification or deterministic unit conversion.
4. **Uncontrolled Enums & Zero Alias Resolution**: Enum values are stored in a loose JSON blob (`validationRules: { allowedValues: [...] }`) on `CitizenAttributeRegistry`. There is no explicit, auditable alias registry; any minor lexical deviation (e.g. lowercase `cultivator` vs canonical `FARMER`) causes rejection or silent rule evaluation failure.
5. **Direct String Conflict Detection**: Document intelligence compares OCR-extracted values directly with declared citizen facts via `String(declared) !== String(extractedValue)`, creating false-positive conflicts on minor formatting discrepancies (e.g. `₹2.5 Lakh` vs `250000`).

---

## 2. Audit of Existing Semantic Capabilities (By Domain)

### 2.1 Citizen Module (Sprint 2 & Sprint 9)

**Authoritative Code**:
- `apps/backend/prisma/schema.prisma` (`CitizenAttributeRegistry`, `CitizenFact`, `CitizenFactHistory`, `CitizenFactVersion`)
- `apps/backend/src/modules/citizen/services/attribute-validation.engine.ts`
- `apps/backend/src/modules/citizen/services/citizen-query.service.ts`
- `apps/backend/prisma/seeds/citizen-attribute.seed.ts`

**Current State**:
- **Registry Structure**: `CitizenAttributeRegistry` defines `key` (String, unique), `displayName`, `category` (`FactCategory`), `dataType` (`AttributeDataType`), `isMandatory`, `validationRules` (Json), `parentKey`, and `activationCondition`.
- **Fact Storage (EAV)**: `CitizenFact` references `CitizenAttributeRegistry` via foreign key `attributeKey -> CitizenAttributeRegistry.key`. Values are partitioned into typed columns: `valueText`, `valueNumber`, `valueBoolean`, `valueDate`, `valueJson`, and `normalizedValue`.
- **Validation Engine**: `AttributeValidationEngine` performs type checking and min/max/regex validation. For enums, it inspects `(validationRules['allowedValues'] as string[])`.
- **Limitations**:
  - `validationRules` is unstructured JSON with no schema enforcement.
  - No concept of canonical semantic codes (e.g. `AGRICULTURE.LAND_AREA`).
  - No unit handling (the unit is informally embedded in the key name, e.g. `landAreaHectares`, which fails if the user provides acres or cents).
  - No alias support: strict equality `allowed.includes(strVal)` rejects valid lexical variants.

### 2.2 Policy & Eligibility Module (Sprint 5)

**Authoritative Code**:
- `apps/backend/prisma/schema.prisma` (`PolicyRule`, `PolicyRuleVersion`, `RuleGroup`, `RuleCondition`)
- `apps/backend/src/modules/eligibility/services/rule-engine.service.ts`
- `apps/backend/src/modules/eligibility/services/context-engine.service.ts`
- `apps/backend/prisma/seeds/policy-rule.seed.ts`

**Current State**:
- **Condition Schema**: `RuleCondition` contains:
  ```prisma
  model RuleCondition {
    id             String             @id @default(uuid())
    groupId        String
    attributeKey   String             // Unrestricted free-form string
    operator       RuleOperator       // EQUALS, GREATER_THAN, IN, etc.
    expectedValue  Json               // Arbitrary JSON / primitive
    estimatedCost  RuleEvaluationCost @default(LOW)
  }
  ```
- **Rule Engine Execution**:
  ```typescript
  // rule-engine.service.ts line 77
  private evaluateCondition(cond: ExecutableRuleCondition, facts: Record<string, unknown>): boolean {
    const actual = facts[cond.attributeKey];
    const expected = cond.expectedValue;
    switch (cond.operator) {
      case RuleOperator.EQUALS: return String(actual) === String(expected);
      case RuleOperator.LESS_OR_EQUAL: return Number(actual) <= Number(expected);
      ...
    }
  }
  ```
- **Limitations**:
  - **Zero Linkage to Citizen Registry**: `RuleCondition.attributeKey` has no relation or validation against `CitizenAttributeRegistry`.
  - **Seed Disconnect**: `policy-rule.seed.ts` seeds condition with `attributeKey: 'landHolding'`, whereas `citizen-attribute.seed.ts` seeds `key: 'landAreaHectares'`. In production evaluation, `facts['landHolding']` evaluates to `undefined`, making the condition fail silently or mis-evaluate.
  - **Naive Equality**: Relies on `String(actual) === String(expected)`. If citizen fact has `"FARMER"` and condition expects `"CULTIVATOR"`, evaluation returns `false` despite them referring to the same semantic occupation class.

### 2.3 Onboarding Module (Sprint 3)

**Authoritative Code**:
- `apps/backend/src/modules/onboarding/services/answer-normalization.engine.ts`
- `apps/backend/src/modules/onboarding/services/question-visibility.engine.ts`

**Current State**:
- **Normalization**: `AnswerNormalizationEngine` normalizes numbers (stripping currency symbols, parsing Indian notation `Lakh` / `Crore` / `k`), booleans (`yes`, `y`, `1`, `true`), and dates.
- **Limitations**:
  - Normalization is purely lexical/syntactic.
  - Does not resolve strings to canonical semantic values (e.g. text `"cultivator"` is only trimmed, not mapped to canonical `CULTIVATOR`).
  - Questions in `QuestionCatalog` decouple UI text from `attributeKey`, but answer options are not bound to a centralized semantic value registry.

### 2.4 Document Module (Sprint 8)

**Authoritative Code**:
- `apps/backend/src/modules/document/services/document.orchestrator.ts`
- `apps/backend/src/modules/document/services/conflict-detection.service.ts`
- `apps/backend/src/modules/document/services/evidence-generation.service.ts`

**Current State**:
- **Fact Extraction**: OCR extracts `Array<{ factKey: string; extractedValue: unknown }>`.
- **Conflict Detection**:
  ```typescript
  // conflict-detection.service.ts line 18
  const declared = params.citizenFacts[extracted.factKey];
  if (declared !== undefined && declared !== null && String(declared) !== String(extracted.extractedValue)) {
    // createConflict(...)
  }
  ```
- **Limitations**:
  - Extracted fact keys are arbitrary strings determined by OCR templates.
  - Direct string comparison generates false conflicts when the document represents the same fact in an un-normalized format (e.g., `"₹2,50,000"` vs `250000`, or `"Single"` vs `SINGLE`).

### 2.5 Fact Verification & Decision Re-evaluation (Sprint 10 & Sprint 11)

**Authoritative Code**:
- `apps/backend/src/modules/fact-verification/services/fact-verification-impact-engine.service.ts`
- `apps/backend/src/modules/decision-re-evaluation/services/decision-diff.service.ts`

**Current State**:
- **Hardcoded Domain Impact Rules**:
  ```typescript
  // fact-verification-impact-engine.service.ts line 22
  if (['annualIncome', 'isLandOwner', 'residenceState', 'casteCategory'].includes(params.attributeKey)) { ... }
  if (['bankAccountNumber', 'aadhaarNumber', 'incomeCertificateNumber'].includes(params.attributeKey)) { ... }
  ```
- **Limitations**:
  - Impact logic hardcodes attribute keys that do not match the Master Attribute Registry (`isLandOwner` vs `isFarmer`/`landAreaHectares`).
  - No machine-readable semantic classification indicating which attributes impact eligibility versus administrative readiness.

---

## 3. Cross-Module Semantic Duplication & Fragmentation Matrix

| Semantic Concept | Citizen Registry Key | Policy Rule Condition Key | Recommendation Key | Journey Checklist Key | Fact Verification Key |
|------------------|----------------------|---------------------------|-------------------|----------------------|-----------------------|
| **Land Holding Area** | `landAreaHectares` | `landHolding` | `landHolding` | `landHolding` | `isLandOwner` (boolean flag) |
| **Annual Income** | `annualIncome` | `annualIncome` | `annualIncome` | N/A | `annualIncome` |
| **Aadhaar Number** | *(Missing)* | N/A | `aadhaarNumber` | `aadhaarNumber` | `aadhaarNumber` |
| **Bank Account** | *(Missing)* | N/A | `bankAccountNumber` | `bankAccountNumber` | `bankAccountNumber` |
| **Farmer Status** | `isFarmer` | N/A (uses `landHolding`) | N/A | N/A | `isLandOwner` |
| **Caste / Community**| `casteCategory` | `casteCategory` | `casteCategory` | N/A | `casteCategory` |

---

## 4. Policy-Specific Derived Classifications vs. Universal Citizen Facts

A foundational architectural flaw is conflating **measured citizen facts** with **policy-specific classifications**.

### The Danger:
- Fact: `landArea = 2.5 acres` (0.404686 hectares * 2.5 = 1.0117 hectares).
- Under **Policy A (PM-KISAN)**: `landArea <= 2.0 hectares` is classified as `SMALL_FARMER`.
- Under **Policy B (State Horticulture Mission)**: `SMALL_FARMER` requires `landArea <= 1.0 hectares`.
- If the citizen profile records `SMALL_FARMER = true` as a global fact, Policy B will mis-evaluate the citizen as eligible.

### Architectural Rule for V1:
1. **Universal Citizen Facts**: Only measurable, objective, provenance-backed facts are stored in `CitizenFact` (e.g. `AGRICULTURE.LAND_AREA = 2.5 ACRE`).
2. **Policy-Specific Derived Classifications**: Classifications like `SMALL_FARMER`, `MARGINAL_FARMER`, `BELOW_POVERTY_LINE`, or `ELIGIBLE_BENEFICIARY` are **never** universal facts. They must be evaluated dynamically by policy rules and attributed to specific `(policyId, policyVersion, ruleId)` evaluation traces.

---

## 5. Scope Boundary: V1 Semantic Contract vs. V2 Ontology

| Dimension | V1 Semantic Contract (THIS TASK) | V2 Rich Ontology (EXPLICITLY DEFERRED) |
|-----------|----------------------------------|---------------------------------------|
| **Primary Goal** | Shared, deterministic semantic identity between facts and rules | Deep semantic relationships, reasoning, and conceptual graphs |
| **Attribute Identity** | Stable hierarchical codes (`DOMAIN.CONCEPT.ATTRIBUTE`) | Dynamic ontology nodes with URI namespaces |
| **Value Control** | Explicit canonical codes + explicit registered aliases | Semantic vector similarity, NLP synonym rings, WordNet mappings |
| **Units & Measurement** | Deterministic linear conversions (e.g. Acre -> Hectare, Lakh -> INR) | Dimensional analysis, scientific unit ontologies (QUDT/UCUM) |
| **Relationships** | Flat attribute definitions with parent-child dependency | Subsumption (`is-a`), transitive equivalence, part-of (`meronymy`) |
| **Inference Engine** | Deterministic boolean/arithmetic rule engine | Semantic reasoners (OWL-DL, Datalog, RDF graph traversals) |
| **AI Authority** | Zero AI authority. AI can only suggest candidate aliases for human review | AI-assisted ontology expansion, ontology-aware RAG |
| **Storage Architecture** | PostgreSQL relational tables (Prisma) | Graph database (Neo4j, RDF triplestore, pgvector graph extensions) |

---

## 6. Backward Compatibility & Non-Breaking Migration Strategy

Existing Sprint 0–12 implementations must remain 100% operational:
1. **Preserve `CitizenAttributeRegistry.key`**: Existing keys (`landAreaHectares`, `annualIncome`, `isFarmer`) remain functional.
2. **Dual-Resolution in Rule Engine**:
   - The rule engine will first attempt to resolve `RuleCondition.attributeKey` as a canonical semantic code (e.g. `AGRICULTURE.LAND_AREA`).
   - If not found or when matching against raw facts, it falls back to the legacy attribute key for backward compatibility.
3. **Additive Schema Only**: No existing tables or columns will be dropped.
4. **Historical Decision Trace Replay**: Past decision traces relying on legacy keys remain bit-for-bit replayable.

---

## 7. Concrete Canonical Proposals for V1

### Core Semantic Domains & Attributes:
1. **`AGRICULTURE.LAND_AREA`**:
   - Canonical Unit: `HECTARE`
   - Supported Conversion Units: `ACRE` (1 ACRE = 0.404686 HECTARE), `CENT` (1 CENT = 0.004047 HECTARE), `SQ_METER` (1 HECTARE = 10000 SQ_METER).
   - Legacy Key Mapping: `landAreaHectares`, `landHolding`.
2. **`FINANCIAL.ANNUAL_INCOME`**:
   - Canonical Unit: `INR`
   - Supported Multipliers: `LAKH` (* 100,000), `CRORE` (* 10,000,000), `THOUSAND` (* 1,000).
   - Legacy Key Mapping: `annualIncome`.
3. **`OCCUPATION.CATEGORY`**:
   - Controlled Canonical Values: `CULTIVATOR`, `AGRICULTURAL_LABOURER`, `SALARIED_EMPLOYEE`, `SELF_EMPLOYED`, `BUSINESS_OWNER`, `STUDENT`, `UNEMPLOYED`, `RETIRED`.
   - Explicit Aliases:
     - `"farmer"` -> `CULTIVATOR`
     - `"cultivator"` -> `CULTIVATOR`
     - `"kisan"` -> `CULTIVATOR`
     - `"salaried"` -> `SALARIED_EMPLOYEE`
     - `"daily wage agricultural worker"` -> `AGRICULTURAL_LABOURER`
   - Legacy Key Mapping: `occupationCategory`.
4. **`DEMOGRAPHICS.DATE_OF_BIRTH`**:
   - Data Type: `DATE` (ISO 8601 `YYYY-MM-DD`).
   - Derived Age Calculation: Deterministic years from reference date.
   - Legacy Key Mapping: `dob`.
5. **`DEMOGRAPHICS.GENDER`**:
   - Controlled Values: `MALE`, `FEMALE`, `TRANSGENDER`, `OTHER`.
   - Legacy Key Mapping: `gender`.
6. **`COMMUNITY.CASTE_CATEGORY`**:
   - Controlled Values: `GENERAL`, `OBC`, `SC`, `ST`, `EWS`.
   - Legacy Key Mapping: `casteCategory`.
7. **`IDENTITY.AADHAAR_NUMBER`**:
   - Data Type: `TEXT` (12-digit numeric, masked storage format).
   - Sensitivity: `HIGH` (PII).
   - Legacy Key Mapping: `aadhaarNumber`.
8. **`IDENTITY.BANK_ACCOUNT_NUMBER`**:
   - Data Type: `TEXT` (Account number string).
   - Sensitivity: `HIGH` (PII).
   - Legacy Key Mapping: `bankAccountNumber`.

---

## 8. Audit Conclusion

The audit proves that GPIOS requires an explicit, centralized **V1 Semantic Contract** to bridge citizen profiles and policy evaluation. The contract must be deterministic, versioned, unit-aware, alias-controlled, and strictly enforce the boundary between universal citizen facts and policy-specific classifications.
