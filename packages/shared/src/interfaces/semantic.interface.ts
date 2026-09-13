import { FactCategory } from '../enums/citizen-fact-category.enum';
import { AttributeDataType } from '../enums/citizen-data-type.enum';

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

export type SemanticAliasType =
  | 'EXACT_LEXICAL_ALIAS'
  | 'REQUIRES_CONTEXT'
  | 'AMBIGUOUS'
  | 'CONTEXTUAL_ALIAS'
  | 'INFERENCE';

export interface SemanticAliasMapping {
  /** Unique ID of the mapping */
  id: string;
  /** Canonical attribute code */
  attributeCode: string;
  /** Raw alias or vernacular term (lowercase, trimmed) */
  rawAlias: string;
  /** Target canonical value */
  canonicalValue: string;
  /** Scope or rationale */
  scope: string;
  /** Alias classification */
  aliasType: SemanticAliasType;
  /** Semantic contract version */
  contractVersion: number;
}

export interface SemanticUnitConversionRule {
  fromUnit: string;
  toUnit: string;
  multiplier: number;
  precision: number;
}

export interface PolicyDerivedClassification {
  /** The policy-specific classification code (e.g. 'SMALL_FARMER') */
  classificationCode: string;
  /** Policy ID that defines this classification */
  policyId: string;
  /** Policy Version */
  policyVersion: string;
  /** Rule ID */
  ruleId: string;
  /** Rule Version */
  ruleVersion: string;
  /** ISO timestamp of evaluation */
  evaluatedAt: string;
  /** Universal facts evaluated as evidence */
  sourceFacts: Record<string, unknown>;
  /** Whether the classification criteria were met */
  isSatisfied: boolean;
  /** Auditable rationale */
  provenanceNote: string;
}

export type SemanticResolutionReason =
  | 'RESOLVED'
  | 'UNRESOLVED_ALIAS'
  | 'AMBIGUOUS_ALIAS'
  | 'CONTEXT_REQUIRED'
  | 'INVALID_DATA_TYPE'
  | 'OUT_OF_BOUNDS';

export interface SemanticResolutionResult<T = unknown> {
  resolved: boolean;
  canonicalAttributeCode?: string;
  canonicalValue?: T;
  canonicalUnit?: string | null;
  rawInput: unknown;
  normalizedInput?: unknown;
  appliedAliasId?: string;
  appliedConversion?: {
    fromUnit: string;
    toUnit: string;
    multiplier: number;
  };
  error?: string;
  reason?: SemanticResolutionReason;
}

export interface SemanticValidationResult {
  isValid: boolean;
  errors: string[];
  canonicalAttribute?: CanonicalSemanticAttribute;
  normalizedValue?: unknown;
}
