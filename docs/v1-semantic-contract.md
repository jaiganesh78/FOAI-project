# V1 Semantic Contract Specification — GPIOS Canonical Semantic Layer

**Document Version**: 1.2.0 — FROZEN STEP 4R.1 BASELINE  
**Date**: 2026-09-12  
**Status**: FROZEN SPECIFICATION (POST-INTEGRITY-AUDIT)  
**Target Platform**: Government Policy Intelligence Operating System (GPIOS)  
**Modules Affected**: `packages/shared`, `citizen`, `policy`, `eligibility`, `onboarding`, `document`, `fact-verification`, `recommendation`, `application-journey`  
**Governing Principle**: *V1 semantic resolution is deterministic and context-free. Context-dependent semantic interpretation requires explicit mapping/context and is not automatically performed by the V1 resolver.*

---

## 1. Terminology & Core Definitions

- **Canonical Semantic Attribute (`SemanticAttribute`)**: A globally unique, machine-readable identifier representing a single atomic, unambiguous observable citizen property (e.g. `AGRICULTURE.LAND_AREA`, `FINANCIAL.ANNUAL_INCOME`).
- **Canonical Semantic Value (`SemanticValue`)**: A strictly controlled, standardized discrete symbol for categorical/enum attributes (e.g. `OCCUPATION.CULTIVATOR`, `COMMUNITY.OBC`).
- **Semantic Alias (`SemanticAlias`)**: An explicit, registered, version-controlled lexical variant mapping a raw string into a canonical semantic value (e.g. `"kisan"` → `OCCUPATION.CULTIVATOR`).
- **Semantic Unit (`SemanticUnit`)**: A standardized unit of measurement (e.g. `HECTARE`, `ACRE`, `INR`) with deterministic linear conversion rules to the canonical base unit.
- **Universal Citizen Fact**: An empirical, measurable, provenance-backed assertion about a citizen that is true independent of any government policy (e.g., "Citizen owns 1.2 hectares of land").
- **Policy-Specific Derived Classification**: A conditional label or status derived by applying a specific policy version's rules to universal citizen facts (e.g., "Small Farmer according to PM-KISAN Version 2"). **Never** stored as a universal fact.
- **Zero-AI Authority**: The constitutional constraint that semantic canonicalization, alias resolution, unit conversion, and rule evaluation must be 100% deterministic, reproducible, and executed without runtime LLM or probabilistic ML inference.
- **Authoritative Legacy Key Array**: Legacy key bridging is authoritatively governed by `legacyAttributeKeys: string[]`. The singular field `legacyAttributeKey` is a deprecated backward-compatibility alias guaranteed to equal `legacyAttributeKeys[0]`.

---

## 2. Canonical Semantic Identifiers

All canonical semantic attributes MUST adhere to the hierarchical namespaced dot-notation:

```
<DOMAIN_NAMESPACE>.<SUBDOMAIN_OR_CONCEPT>[.<PROPERTY>]
```

### Namespace & Domain Clarification:
The V1 semantic layer defines **11 canonical attributes across 8 syntactic namespaces mapped to 7 underlying FactCategory domains**:
- **8 Syntactic Namespaces**:
  1. `AGRICULTURE`
  2. `FINANCIAL`
  3. `OCCUPATION`
  4. `DEMOGRAPHICS`
  5. `COMMUNITY`
  6. `ECONOMIC`
  7. `IDENTITY`
  8. `DISABILITY`
- **7 Underlying `FactCategory` Domains**:
  1. `FactCategory.AGRICULTURE` (`AGRICULTURE.LAND_AREA`, `AGRICULTURE.LAND_OWNERSHIP_STATUS`)
  2. `FactCategory.FINANCIAL` (`FINANCIAL.ANNUAL_INCOME`, `ECONOMIC.EWS_STATUS`)
  3. `FactCategory.OCCUPATION` (`OCCUPATION.CATEGORY`)
  4. `FactCategory.DEMOGRAPHICS` (`DEMOGRAPHICS.DATE_OF_BIRTH`, `DEMOGRAPHICS.GENDER`)
  5. `FactCategory.COMMUNITY` (`COMMUNITY.SOCIAL_CATEGORY`)
  6. `FactCategory.GOVERNMENT_IDENTIFIER` (`IDENTITY.AADHAAR_NUMBER`, `IDENTITY.BANK_ACCOUNT_NUMBER`)
  7. `FactCategory.DISABILITY` (`DISABILITY.BENCHMARK_STATUS`)

### Identifier Format Rules:
1. Uppercase alphanumeric characters and underscores only.
2. Segment delimiter is a single dot (`.`).
3. Must start with a recognized namespace prefix.
4. Maximum length: 64 characters.
5. Strict runtime validation (`validateCanonicalCode`) rejects malformed strings, whitespace, wrong casing, non-strings, and unrecognized namespaces.

---

## 3. Canonical Attribute Contract

Each canonical semantic attribute defines:

```typescript
export interface CanonicalSemanticAttribute {
  /** Stable unique canonical identifier: e.g. 'AGRICULTURE.LAND_AREA' */
  code: string;
  /** Human-readable display name: e.g. 'Agricultural Land Holding Area' */
  displayName: string;
  /** Domain classification */
  domain: FactCategory;
  /** Primitive data type */
  dataType: AttributeDataType;
  /** Canonical base unit (if measurable), or null for dimensionless/categorical */
  canonicalUnit: string | null;
  /** Validation rules (min, max, regex, allowed values) */
  validationRules?: {
    min?: number;
    max?: number;
    regex?: string;
    allowedValues?: string[];
  };
  /**
   * @deprecated Singular legacy attribute key for backward compatibility.
   * Authoritative source of truth is `legacyAttributeKeys`.
   * Guaranteed invariant: `legacyAttributeKey === legacyAttributeKeys[0]`.
   */
  legacyAttributeKey: string;
  /** Complete authoritative list of legitimate legacy attribute keys: e.g. ['landAreaHectares', 'landHolding'] */
  legacyAttributeKeys: string[];
  /** Privacy and security classification */
  isSensitive: boolean;
  /** Semantic contract version that introduced this definition */
  contractVersion: number;
}
```

### Frozen V1 Canonical Attribute Registry (11 Attributes):

| Canonical Code | Domain Namespace | Underlying `FactCategory` | Data Type | Canonical Unit | Authoritative Legacy Keys (`legacyAttributeKeys`) | Deprecated Singular (`legacyAttributeKey`) | Allowed Values / Constraints | Implementation Status |
|---|---|---|---|---|---|---|---|---|
| `AGRICULTURE.LAND_AREA` | `AGRICULTURE` | `AGRICULTURE` | `NUMBER` | `HECTARE` | `['landAreaHectares', 'landHolding']` | `'landAreaHectares'` | `min: 0, max: 10000` | `VERIFIED` |
| `AGRICULTURE.LAND_OWNERSHIP_STATUS` | `AGRICULTURE` | `AGRICULTURE` | `BOOLEAN` | `null` | `['isLandOwner']` | `'isLandOwner'` | `true`, `false` | `VERIFIED` |
| `FINANCIAL.ANNUAL_INCOME` | `FINANCIAL` | `FINANCIAL` | `NUMBER` | `INR` | `['annualIncome']` | `'annualIncome'` | `min: 0, max: 1000000000` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `OCCUPATION` | `OCCUPATION` | `ENUM` | `null` | `['occupationCategory']` | `'occupationCategory'` | Controlled `SemanticValue` list | `VERIFIED` |
| `DEMOGRAPHICS.DATE_OF_BIRTH` | `DEMOGRAPHICS` | `DEMOGRAPHICS` | `DATE` | `null` | `['dob']` | `'dob'` | Valid ISO 8601 Date | `VERIFIED` |
| `DEMOGRAPHICS.GENDER` | `DEMOGRAPHICS` | `DEMOGRAPHICS` | `ENUM` | `null` | `['gender']` | `'gender'` | `MALE`, `FEMALE`, `TRANSGENDER`, `OTHER` | `VERIFIED` |
| `COMMUNITY.SOCIAL_CATEGORY` | `COMMUNITY` | `COMMUNITY` | `ENUM` | `null` | `['casteCategory', 'socialCategory']` | `'casteCategory'` | `GENERAL`, `OBC`, `SC`, `ST` | `VERIFIED` |
| `ECONOMIC.EWS_STATUS` | `ECONOMIC` | `FINANCIAL` | `BOOLEAN` | `null` | `['isEws', 'ewsStatus']` | `'isEws'` | `true`, `false` | `VERIFIED` |
| `IDENTITY.AADHAAR_NUMBER` | `IDENTITY` | `GOVERNMENT_IDENTIFIER` | `TEXT` | `null` | `['aadhaarNumber']` | `'aadhaarNumber'` | `regex: ^[0-9]{12}$` (Sensitive) | `VERIFIED` |
| `IDENTITY.BANK_ACCOUNT_NUMBER` | `IDENTITY` | `GOVERNMENT_IDENTIFIER` | `TEXT` | `null` | `['bankAccountNumber']` | `'bankAccountNumber'` | `min: 8, max: 20` (Sensitive) | `VERIFIED` |
| `DISABILITY.BENCHMARK_STATUS` | `DISABILITY` | `DISABILITY` | `BOOLEAN` | `null` | `['isPersonWithDisability']` | `'isPersonWithDisability'` | `true`, `false` | `VERIFIED` |

> [!IMPORTANT]
> **Hard Semantic Boundaries Established in Step 4R / 4R.1**:
> 1. `AGRICULTURE.LAND_AREA` ≠ `AGRICULTURE.LAND_OWNERSHIP_STATUS`: Knowing that a citizen owns land does not establish the area of land owned. Having land area does not establish legal ownership status without a separate policy rule. Both directions are isolated.
> 2. `COMMUNITY.SOCIAL_CATEGORY` ≠ `ECONOMIC.EWS_STATUS`: EWS is an income-based economic criterion, not an affirmative action social or caste category.

---

## 4. Controlled Semantic Values Contract

For categorical (`ENUM`) semantic attributes, only explicitly defined canonical values are valid.

### `OCCUPATION.CATEGORY` Canonical Values:
- `CULTIVATOR`: Operating and managing agricultural land for crop production.
- `AGRICULTURAL_LABOURER`: Working on agricultural land for wages without ownership/tenancy.
- `SALARIED_EMPLOYEE`: Formally employed receiving regular monthly compensation.
- `SELF_EMPLOYED`: Engaging in independent trade, craft, profession, or unincorporated enterprise.
- `BUSINESS_OWNER`: Owning and operating a registered business entity.
- `STUDENT`: Enrolled in formal recognized education.
- `UNEMPLOYED`: Seeking employment but currently without occupation.
- `RETIRED`: Discontinued active career/occupation due to age.

### `COMMUNITY.SOCIAL_CATEGORY` Canonical Values:
- `GENERAL`: Unreserved social category.
- `OBC`: Other Backward Classes.
- `SC`: Scheduled Castes.
- `ST`: Scheduled Tribes.

---

## 5. Explicit Semantic Alias Contract (Context-Free V1 Resolution)

V1 runtime resolution is strictly **context-free and deterministic**.
The runtime receives no scheme ID, policy context, question context, or document context.
Therefore:
- **`EXACT_LEXICAL_ALIAS`**: Unambiguous lexical translations or standard abbreviations resolve automatically (`resolved: true, reason: 'RESOLVED'`).
- **`REQUIRES_CONTEXT`**: Context-dependent terms (e.g. `"farmer"`, `"agricultural worker"`, `"government employee"`, `"private job"`, `"shopkeeper"`) **MUST NOT** resolve automatically in V1. They return `resolved: false, reason: 'CONTEXT_REQUIRED'`.
- **`AMBIGUOUS`**: Inherently ambiguous inputs (e.g. `"business"`) **MUST NOT** resolve automatically. They return `resolved: false, reason: 'AMBIGUOUS_ALIAS'`.
- **`UNRESOLVED_ALIAS`**: Any unmapped string returns `resolved: false, reason: 'UNRESOLVED_ALIAS'`.
- **Invariant**: Every unsuccessful resolution strictly returns `canonicalValue: undefined`.

### Frozen V1 Alias Registry:

| Semantic Attribute | Raw / Alias Input | Canonical Value Target | Alias Type | V1 Runtime Result | Reason Code | Status |
|---|---|---|---|---|---|---|
| `OCCUPATION.CATEGORY` | `"cultivator"` | `CULTIVATOR` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"kisan"` | `CULTIVATOR` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"krishak"` | `CULTIVATOR` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"agricultural labourer"` | `AGRICULTURAL_LABOURER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"agricultural laborer"` | `AGRICULTURAL_LABOURER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"farm labourer"` | `AGRICULTURAL_LABOURER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"farm laborer"` | `AGRICULTURAL_LABOURER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"salaried employee"` | `SALARIED_EMPLOYEE` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"salaried"` | `SALARIED_EMPLOYEE` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"business owner"` | `BUSINESS_OWNER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"enterprise owner"` | `BUSINESS_OWNER` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"farmer"` | `CULTIVATOR` | `REQUIRES_CONTEXT` | `resolved: false` | `CONTEXT_REQUIRED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"agricultural worker"` | `AGRICULTURAL_LABOURER` | `REQUIRES_CONTEXT` | `resolved: false` | `CONTEXT_REQUIRED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"government employee"` | `SALARIED_EMPLOYEE` | `REQUIRES_CONTEXT` | `resolved: false` | `CONTEXT_REQUIRED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"private job"` | `SALARIED_EMPLOYEE` | `REQUIRES_CONTEXT` | `resolved: false` | `CONTEXT_REQUIRED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"shopkeeper"` | `SELF_EMPLOYED` | `REQUIRES_CONTEXT` | `resolved: false` | `CONTEXT_REQUIRED` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"business"` | `BUSINESS_OWNER` | `AMBIGUOUS` | `resolved: false` | `AMBIGUOUS_ALIAS` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"business worker"` | `BUSINESS_OWNER` | `AMBIGUOUS` | `resolved: false` | `AMBIGUOUS_ALIAS` | `VERIFIED` |
| `OCCUPATION.CATEGORY` | `"business employee"` | `SALARIED_EMPLOYEE` | `AMBIGUOUS` | `resolved: false` | `AMBIGUOUS_ALIAS` | `VERIFIED` |
| `DEMOGRAPHICS.GENDER` | `"m"`, `"male"` | `MALE` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `DEMOGRAPHICS.GENDER` | `"f"`, `"female"` | `FEMALE` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `COMMUNITY.SOCIAL_CATEGORY` | `"gen"`, `"general"` | `GENERAL` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `COMMUNITY.SOCIAL_CATEGORY` | `"obc"` | `OBC` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `COMMUNITY.SOCIAL_CATEGORY` | `"sc"` | `SC` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |
| `COMMUNITY.SOCIAL_CATEGORY` | `"st"` | `ST` | `EXACT_LEXICAL_ALIAS` | `resolved: true` | `RESOLVED` | `VERIFIED` |

---

## 6. Deterministic Measurement & Unit Conversion Contract

### 6.1 Universal Area Conversion Contract (`Canonical Base: HECTARE`)
- Formula: `ValueInHectares = RawValue * Multiplier`
- Fixed Universal Conversion Factors:
  - `HECTARE`: Multiplier = `1.0`
  - `ACRE`: Multiplier = `0.404686` (1 acre = 0.404686 hectares)
  - `SQ_METER`: Multiplier = `0.0001` (1 sq meter = 0.0001 hectares)
  - `CENT`: Multiplier = `0.004047` (1 cent = 0.004047 hectares)
- Precision: Calculations rounded to 6 decimal places (`toFixed(6)`).

### 6.2 Regional Land Unit Safety Policy
- Units such as `BIGHA`, `BIGHA_PUCCA`, `BIGHA_KACCHA`, `BIGHA_REGIONAL`, `GUNTHA`, `KATTHA`, `MARLA`, `KANAL`, `BISWA` vary by state and district.
- **V1 Policy**: Universal conversion of regional units is **STRICTLY REJECTED**.
- Any conversion attempt fails immediately: `"Regional unit requires explicit jurisdictional context and cannot be converted using a universal multiplier in V1."`

### 6.3 Universal Currency Conversion Contract (`Canonical Base: INR`)
- Formula: `ValueInINR = RawValue * Multiplier`
- Factors: `INR` (1.0), `LAKH` (100000.0), `CRORE` (10000000.0), `THOUSAND` (1000.0)
- Precision: 2 decimal places (`toFixed(2)`).

### 6.4 Numerical Determinism & Finite Number Guarantees
- Numeric rule operators (`GREATER_THAN`, `LESS_THAN`, `GREATER_OR_EQUAL`, `LESS_OR_EQUAL`, `BETWEEN`) enforce `Number.isFinite()`.
- `NaN`, `Infinity`, `-Infinity`, and values exceeding `1e12` fail numeric comparisons and unit conversions.
- Boundary threshold tests (`threshold - epsilon`, `threshold`, `threshold + epsilon`) behave with exact mathematical determinism.

---

## 7. Versioning Hierarchy & Historical Replay Reality

### Hierarchy:
1. **Semantic Contract Version (`contractVersion: 1`)**: Global semantic contract version.
2. **Semantic Definition Revision**: Internal code-managed definition of canonical attributes and aliases.
3. **Policy Version (`policyVersion`)**: Government scheme version (e.g., PM-KISAN v2.0).
4. **Rule Version (`ruleVersion`)**: Compiled logic version of an individual rule.

### Truthful Replay Boundary:
- Historical legacy rule representations remain evaluable through deterministic legacy-key bridging where their semantics are preserved.
- Historical decision replay (`DecisionReplayService`) operates by verifying immutable stored decision traces and snapshots.
- **V1 Architectural Boundary**: V1 does not provide arbitrary temporal replay across semantic-definition revisions. Dynamic re-evaluation uses the current immutable code release. Database-backed temporal semantic versioning is explicitly deferred to V2.

---

## 8. Policy-Specific Derived Classification Contract

Classifications derived from policy rules (e.g. `SMALL_FARMER`, `MARGINAL_FARMER`, `SCHEME_ELIGIBLE`) MUST:
1. **Never** be written into `CitizenFact` as a universal attribute.
2. Be materialized strictly inside `PolicyDerivedClassification` projections.
3. Explicitly reference: `policyId`, `policyVersion`, `ruleId`, `ruleVersion`, `evaluatedAt`, and source facts.
4. The guard `assertNotPolicyDerivedClassification` rejects attempts to store these labels in universal facts.

---

## 9. AI and Machine Learning Boundaries

1. **Zero-AI Authority**: LLMs, embeddings, and machine learning models are strictly prohibited from canonicalizing facts, creating aliases, or evaluating eligibility.
2. **Candidate Role Only**: AI may only suggest candidate mappings for human auditor review.
3. **Vector / RAG Limitation**: Vector similarity is used strictly for document discovery. Vector similarity score is **NEVER** proof of eligibility or proof of semantic equivalence.

---

## 10. Integration Status Breakdown

| Subsystem | Contract Status | Implementation Status | Notes |
|---|---|---|---|
| `packages/shared` | `FROZEN` | `VERIFIED` | Full shared contracts, enums, DTOs, schemas |
| `SemanticRegistryService` | `FROZEN` | `VERIFIED` | Immutable code-managed registry |
| `PolicyDerivedClassificationService` | `FROZEN` | `VERIFIED` | Boundary guard protecting citizen facts |
| `RuleEngineService` | `FROZEN` | `VERIFIED` | Finite numeric comparisons & alias-aware condition evaluation |
| `Fact Verification` | `FROZEN` | `PARTIALLY VERIFIED` | Impact engine uses legacy keys matching registered bridge |
| `Onboarding (QuestionCatalog)` | `FROZEN` | `PLANNED (GAP-SEM-001)` | QuestionCatalog currently uses static seed data |
| `Document Intelligence` | `FROZEN` | `CONTRACT TARGET (GAP-SEM-002)` | OCR fact normalization prior to conflict detection |
| `Recommendation Engine` | `FROZEN` | `CONTRACT ONLY / PLANNED` | References legacy keys directly (`citizenFacts.landHolding`) |
| `Application Journey` | `FROZEN` | `CONTRACT ONLY / PLANNED` | References legacy keys directly (`citizenFacts.landHolding`) |
| `Admin UI / Governance` | `FROZEN` | `PLANNED (GAP-SEM-003)` | Human auditor alias review workflow |

---

## 11. V1 vs. V2 Explicit Boundary

```
+-------------------------------------------------------------------------+
|                              V1 (FROZEN)                                |
|  - Code-Managed Immutable Registry                                      |
|  - Canonical Semantic Attributes (8 Hierarchical Namespaces / 7 Domains)|
|  - Controlled Semantic Values (Categorical Enums)                       |
|  - Explicit Exact Lexical Aliases (Context-Free Determinism)             |
|  - Rejection of Context-Dependent & Ambiguous Aliases Without Context   |
|  - Universal Linear Unit Conversions (Area, Currency)                   |
|  - Rejection of Regional Units Without Jurisdiction Context             |
|  - Finite Number Enforcement in Numeric Operators (Number.isFinite)     |
|  - Authoritative Multi-Legacy-Key Bridging (legacyAttributeKeys: string[])|
|  - Strict Separation of Base Facts vs Policy Derived Classifications    |
|  - Separation of Social Category from EWS Economic Status               |
|  - Zero-AI Deterministic Execution Guard                                |
+-------------------------------------------------------------------------+
                                     |
                                     v (DEFERRED TO V2)
+-------------------------------------------------------------------------+
|                              V2 (FUTURE)                                |
|  - Dynamic Graph Ontologies (RDF / OWL / Triplestores / SPARQL)         |
|  - Concept Hierarchy & Automatic Subsumption (Is-A, Part-Of)            |
|  - Vector-Assisted Semantic Discovery & Synonym Rings                   |
|  - Jurisdiction-Aware Cadastral Land Unit Engine (State-Specific Bigha) |
|  - Temporal Database-Backed Semantic History & Definition Time-Travel   |
|  - Multi-Dimensional Scientific Unit Ontologies (QUDT)                  |
|  - Autonomous Candidate Alias Suggestion with Human Governance Review   |
|  - Cross-Jurisdiction Legal Concept Translation                         |
+-------------------------------------------------------------------------+
```
