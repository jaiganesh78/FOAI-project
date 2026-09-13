import { Injectable } from '@nestjs/common';
import {
  CanonicalSemanticAttribute,
  CanonicalSemanticAttributeCode,
  SemanticAliasMapping,
  SemanticUnit,
  FactCategory,
  AttributeDataType,
  CanonicalOccupationCategory,
  CanonicalGender,
  CanonicalSocialCategory,
  CanonicalCasteCategory,
  SemanticResolutionResult,
  SemanticValidationResult,
} from '@gpios/shared';

@Injectable()
export class SemanticRegistryService {
  public static readonly CONTRACT_VERSION = 1;

  // Recognized domain namespaces
  public static readonly RECOGNIZED_NAMESPACES = new Set([
    'AGRICULTURE',
    'FINANCIAL',
    'OCCUPATION',
    'DEMOGRAPHICS',
    'COMMUNITY',
    'ECONOMIC',
    'IDENTITY',
    'DISABILITY',
  ]);

  // Frozen V1 Canonical Attributes
  private readonly canonicalAttributes: Map<string, CanonicalSemanticAttribute> = new Map();

  // Legacy key -> Canonical code index (supports multi-to-one mapping)
  private readonly legacyKeyToCanonicalCode: Map<string, string> = new Map();

  // Controlled values per canonical attribute
  private readonly controlledValues: Map<string, Set<string>> = new Map();

  // Explicit aliases: attributeCode -> Map<normalizedAlias, SemanticAliasMapping>
  private readonly aliasRegistry: Map<string, Map<string, SemanticAliasMapping>> = new Map();

  // Universal deterministic unit conversion multipliers to domain base unit
  // Area Universal Base = HECTARE
  private readonly areaConversionMultipliers: Map<string, number> = new Map([
    [SemanticUnit.HECTARE, 1.0],
    [SemanticUnit.ACRE, 0.404686],
    [SemanticUnit.SQ_METER, 0.0001],
    [SemanticUnit.CENT, 0.004047],
  ]);

  // Currency Universal Base = INR
  private readonly currencyConversionMultipliers: Map<string, number> = new Map([
    [SemanticUnit.INR, 1.0],
    [SemanticUnit.LAKH, 100000.0],
    [SemanticUnit.CRORE, 10000000.0],
    [SemanticUnit.THOUSAND, 1000.0],
  ]);

  // Known regional land units that REQUIRE jurisdiction context and cannot be converted with universal multiplier
  private readonly regionalUnitsRequiringJurisdiction: Set<string> = new Set([
    SemanticUnit.BIGHA_REGIONAL,
    'BIGHA',
    'BIGHA_PUCCA',
    'BIGHA_KACCHA',
    'GUNTHA',
    'KATTHA',
    'MARLA',
    'KANAL',
    'BISWA',
  ]);

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    const attributes: CanonicalSemanticAttribute[] = [
      {
        code: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
        displayName: 'Agricultural Land Holding Area',
        domain: FactCategory.AGRICULTURE,
        dataType: AttributeDataType.NUMBER,
        canonicalUnit: SemanticUnit.HECTARE,
        legacyAttributeKey: 'landAreaHectares',
        legacyAttributeKeys: ['landAreaHectares', 'landHolding'],
        validationRules: { min: 0, max: 10000 },
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_OWNERSHIP,
        displayName: 'Agricultural Land Ownership Status',
        domain: FactCategory.AGRICULTURE,
        dataType: AttributeDataType.BOOLEAN,
        canonicalUnit: null,
        legacyAttributeKey: 'isLandOwner',
        legacyAttributeKeys: ['isLandOwner'],
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.FINANCIAL_ANNUAL_INCOME,
        displayName: 'Annual Household Income',
        domain: FactCategory.FINANCIAL,
        dataType: AttributeDataType.NUMBER,
        canonicalUnit: SemanticUnit.INR,
        legacyAttributeKey: 'annualIncome',
        legacyAttributeKeys: ['annualIncome'],
        validationRules: { min: 0, max: 1000000000 },
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY,
        displayName: 'Primary Occupation Category',
        domain: FactCategory.OCCUPATION,
        dataType: AttributeDataType.ENUM,
        canonicalUnit: null,
        legacyAttributeKey: 'occupationCategory',
        legacyAttributeKeys: ['occupationCategory'],
        validationRules: {
          allowedValues: Object.values(CanonicalOccupationCategory),
        },
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.DEMOGRAPHICS_DOB,
        displayName: 'Date of Birth',
        domain: FactCategory.DEMOGRAPHICS,
        dataType: AttributeDataType.DATE,
        canonicalUnit: null,
        legacyAttributeKey: 'dob',
        legacyAttributeKeys: ['dob'],
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.DEMOGRAPHICS_GENDER,
        displayName: 'Gender',
        domain: FactCategory.DEMOGRAPHICS,
        dataType: AttributeDataType.ENUM,
        canonicalUnit: null,
        legacyAttributeKey: 'gender',
        legacyAttributeKeys: ['gender'],
        validationRules: {
          allowedValues: Object.values(CanonicalGender),
        },
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY,
        displayName: 'Social Community Category',
        domain: FactCategory.COMMUNITY,
        dataType: AttributeDataType.ENUM,
        canonicalUnit: null,
        legacyAttributeKey: 'casteCategory',
        legacyAttributeKeys: ['casteCategory', 'socialCategory'],
        validationRules: {
          allowedValues: Object.values(CanonicalSocialCategory),
        },
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.ECONOMIC_EWS_STATUS,
        displayName: 'Economically Weaker Section (EWS) Status',
        domain: FactCategory.FINANCIAL,
        dataType: AttributeDataType.BOOLEAN,
        canonicalUnit: null,
        legacyAttributeKey: 'isEws',
        legacyAttributeKeys: ['isEws', 'ewsStatus'],
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.IDENTITY_AADHAAR,
        displayName: 'Aadhaar Identification Number',
        domain: FactCategory.GOVERNMENT_IDENTIFIER,
        dataType: AttributeDataType.TEXT,
        canonicalUnit: null,
        legacyAttributeKey: 'aadhaarNumber',
        legacyAttributeKeys: ['aadhaarNumber'],
        validationRules: { regex: '^[0-9]{12}$' },
        isSensitive: true,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.IDENTITY_BANK_ACCOUNT,
        displayName: 'Bank Account Number',
        domain: FactCategory.GOVERNMENT_IDENTIFIER,
        dataType: AttributeDataType.TEXT,
        canonicalUnit: null,
        legacyAttributeKey: 'bankAccountNumber',
        legacyAttributeKeys: ['bankAccountNumber'],
        validationRules: { min: 8, max: 20 },
        isSensitive: true,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
      {
        code: CanonicalSemanticAttributeCode.DISABILITY_STATUS,
        displayName: 'Benchmark Disability Status',
        domain: FactCategory.DISABILITY,
        dataType: AttributeDataType.BOOLEAN,
        canonicalUnit: null,
        legacyAttributeKey: 'isPersonWithDisability',
        legacyAttributeKeys: ['isPersonWithDisability'],
        isSensitive: false,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      },
    ];

    for (const attr of attributes) {
      // Codify invariant: legacyAttributeKey must be identical to legacyAttributeKeys[0]
      if (attr.legacyAttributeKey !== attr.legacyAttributeKeys[0]) {
        throw new Error(`Integrity Violation: Attribute '${attr.code}' legacyAttributeKey must match legacyAttributeKeys[0]`);
      }

      this.canonicalAttributes.set(attr.code, attr);

      for (const legacyKey of attr.legacyAttributeKeys) {
        this.legacyKeyToCanonicalCode.set(legacyKey, attr.code);
      }

      if (attr.validationRules?.allowedValues) {
        this.controlledValues.set(attr.code, new Set(attr.validationRules.allowedValues));
      }
    }

    // Backward compatibility alias for legacy code 'COMMUNITY.CASTE_CATEGORY'
    this.canonicalAttributes.set(
      CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY,
      this.canonicalAttributes.get(CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY)!,
    );
    this.controlledValues.set(
      CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY,
      this.controlledValues.get(CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY)!,
    );

    // Initialize Explicit V1 Aliases with strict taxonomy:
    // EXACT_LEXICAL_ALIAS: Unambiguous lexical translations that resolve automatically in V1.
    // REQUIRES_CONTEXT: Context-dependent terms that MUST NOT resolve without scheme/jurisdiction context.
    // AMBIGUOUS: Inherently ambiguous phrases that MUST NOT resolve automatically.
    const aliases: Omit<SemanticAliasMapping, 'id' | 'contractVersion'>[] = [
      // OCCUPATION.CATEGORY — Exact Lexical Aliases (SAFE_DETERMINISTIC_ALIAS)
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'cultivator', canonicalValue: CanonicalOccupationCategory.CULTIVATOR, scope: 'Formal English translation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'kisan', canonicalValue: CanonicalOccupationCategory.CULTIVATOR, scope: 'Vernacular Hindi translation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'krishak', canonicalValue: CanonicalOccupationCategory.CULTIVATOR, scope: 'Formal Sanskrit/vernacular translation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'agricultural labourer', canonicalValue: CanonicalOccupationCategory.AGRICULTURAL_LABOURER, scope: 'British spelling exact lexical match', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'agricultural laborer', canonicalValue: CanonicalOccupationCategory.AGRICULTURAL_LABOURER, scope: 'American spelling exact lexical match', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'farm labourer', canonicalValue: CanonicalOccupationCategory.AGRICULTURAL_LABOURER, scope: 'Wage labour synonym', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'farm laborer', canonicalValue: CanonicalOccupationCategory.AGRICULTURAL_LABOURER, scope: 'Wage labour synonym', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'salaried employee', canonicalValue: CanonicalOccupationCategory.SALARIED_EMPLOYEE, scope: 'Standard representation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'salaried', canonicalValue: CanonicalOccupationCategory.SALARIED_EMPLOYEE, scope: 'Direct abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'business owner', canonicalValue: CanonicalOccupationCategory.BUSINESS_OWNER, scope: 'Explicit enterprise ownership', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'enterprise owner', canonicalValue: CanonicalOccupationCategory.BUSINESS_OWNER, scope: 'Formal enterprise ownership', aliasType: 'EXACT_LEXICAL_ALIAS' },

      // OCCUPATION.CATEGORY — Context-Required Aliases (REQUIRES_CONTEXT: Rejected in context-free V1 runtime)
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'farmer', canonicalValue: CanonicalOccupationCategory.CULTIVATOR, scope: 'Requires rural scheme / landholding context; ambiguous with agricultural labourer in general context', aliasType: 'REQUIRES_CONTEXT' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'agricultural worker', canonicalValue: CanonicalOccupationCategory.AGRICULTURAL_LABOURER, scope: 'Requires employment context; ambiguous with cultivator and agricultural labourer', aliasType: 'REQUIRES_CONTEXT' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'government employee', canonicalValue: CanonicalOccupationCategory.SALARIED_EMPLOYEE, scope: 'Requires employment contract context; could be permanent salaried, contractual, or honorary', aliasType: 'REQUIRES_CONTEXT' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'private job', canonicalValue: CanonicalOccupationCategory.SALARIED_EMPLOYEE, scope: 'Colloquial phrase requiring formal vs informal employment context', aliasType: 'REQUIRES_CONTEXT' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'shopkeeper', canonicalValue: CanonicalOccupationCategory.SELF_EMPLOYED, scope: 'Requires enterprise context; could be self-employed artisan or small business owner', aliasType: 'REQUIRES_CONTEXT' },

      // OCCUPATION.CATEGORY — Explicitly Ambiguous Inputs (AMBIGUOUS: Rejected in V1 runtime)
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'business', canonicalValue: CanonicalOccupationCategory.BUSINESS_OWNER, scope: 'Ambiguous: employee at a business vs registered enterprise owner', aliasType: 'AMBIGUOUS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'business worker', canonicalValue: CanonicalOccupationCategory.BUSINESS_OWNER, scope: 'Ambiguous: corporate staff vs daily wage', aliasType: 'AMBIGUOUS' },
      { attributeCode: CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, rawAlias: 'business employee', canonicalValue: CanonicalOccupationCategory.SALARIED_EMPLOYEE, scope: 'Ambiguous: salaried employee vs unorganized trade', aliasType: 'AMBIGUOUS' },

      // DEMOGRAPHICS.GENDER
      { attributeCode: CanonicalSemanticAttributeCode.DEMOGRAPHICS_GENDER, rawAlias: 'm', canonicalValue: CanonicalGender.MALE, scope: 'Single letter abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.DEMOGRAPHICS_GENDER, rawAlias: 'male', canonicalValue: CanonicalGender.MALE, scope: 'Standard', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.DEMOGRAPHICS_GENDER, rawAlias: 'f', canonicalValue: CanonicalGender.FEMALE, scope: 'Single letter abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.DEMOGRAPHICS_GENDER, rawAlias: 'female', canonicalValue: CanonicalGender.FEMALE, scope: 'Standard', aliasType: 'EXACT_LEXICAL_ALIAS' },

      // COMMUNITY.SOCIAL_CATEGORY
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, rawAlias: 'gen', canonicalValue: CanonicalCasteCategory.GENERAL, scope: 'Abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, rawAlias: 'general', canonicalValue: CanonicalCasteCategory.GENERAL, scope: 'Standard', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, rawAlias: 'obc', canonicalValue: CanonicalCasteCategory.OBC, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, rawAlias: 'sc', canonicalValue: CanonicalCasteCategory.SC, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, rawAlias: 'st', canonicalValue: CanonicalCasteCategory.ST, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },

      // COMMUNITY.CASTE_CATEGORY (Mirror for backward compatibility)
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY, rawAlias: 'gen', canonicalValue: CanonicalCasteCategory.GENERAL, scope: 'Abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY, rawAlias: 'general', canonicalValue: CanonicalCasteCategory.GENERAL, scope: 'Standard', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY, rawAlias: 'obc', canonicalValue: CanonicalCasteCategory.OBC, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY, rawAlias: 'sc', canonicalValue: CanonicalCasteCategory.SC, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
      { attributeCode: CanonicalSemanticAttributeCode.COMMUNITY_CASTE_CATEGORY, rawAlias: 'st', canonicalValue: CanonicalCasteCategory.ST, scope: 'Standard abbreviation', aliasType: 'EXACT_LEXICAL_ALIAS' },
    ];

    let index = 1;
    for (const a of aliases) {
      const mapping: SemanticAliasMapping = {
        id: `ALIAS-V1-${String(index++).padStart(3, '0')}`,
        attributeCode: a.attributeCode,
        rawAlias: a.rawAlias.toLowerCase().trim(),
        canonicalValue: a.canonicalValue,
        scope: a.scope,
        aliasType: a.aliasType,
        contractVersion: SemanticRegistryService.CONTRACT_VERSION,
      };

      if (!this.aliasRegistry.has(a.attributeCode)) {
        this.aliasRegistry.set(a.attributeCode, new Map());
      }
      this.aliasRegistry.get(a.attributeCode)!.set(mapping.rawAlias, mapping);
    }
  }

  getContractVersion(): number {
    return SemanticRegistryService.CONTRACT_VERSION;
  }

  /**
   * Strict runtime validation of canonical semantic attribute code format and namespace.
   */
  validateCanonicalCode(code: string): { isValid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'Canonical attribute code must be a non-empty string' };
    }

    if (code.trim() !== code) {
      return { isValid: false, error: `Canonical attribute code must not have leading or trailing whitespace: '${code}'` };
    }

    // Pattern: <NAMESPACE>.<SUBDOMAIN_OR_CONCEPT>[.<PROPERTY>]
    const regex = /^[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]+(?:\.[A-Z][A-Z0-9_]+)?$/;
    if (!regex.test(code)) {
      return { isValid: false, error: `Malformed canonical attribute code format: '${code}'. Expected uppercase namespaced dot notation.` };
    }

    const namespace = code.split('.')[0];
    if (!SemanticRegistryService.RECOGNIZED_NAMESPACES.has(namespace)) {
      return { isValid: false, error: `Unrecognized canonical attribute namespace: '${namespace}' in code '${code}'` };
    }

    if (!this.canonicalAttributes.has(code)) {
      return { isValid: false, error: `Unknown canonical attribute code: '${code}'. Not registered in V1 Semantic Registry.` };
    }

    return { isValid: true };
  }

  getCanonicalAttribute(codeOrLegacyKey: string): CanonicalSemanticAttribute | null {
    if (!codeOrLegacyKey) return null;
    const direct = this.canonicalAttributes.get(codeOrLegacyKey);
    if (direct) return direct;

    const mappedCode = this.legacyKeyToCanonicalCode.get(codeOrLegacyKey);
    if (mappedCode) {
      return this.canonicalAttributes.get(mappedCode) ?? null;
    }
    return null;
  }

  resolveCanonicalCode(codeOrLegacyKey: string): string | null {
    if (!codeOrLegacyKey) return null;
    if (this.canonicalAttributes.has(codeOrLegacyKey)) return codeOrLegacyKey;
    return this.legacyKeyToCanonicalCode.get(codeOrLegacyKey) ?? null;
  }

  getControlledValues(codeOrLegacyKey: string): string[] | null {
    const attr = this.getCanonicalAttribute(codeOrLegacyKey);
    if (!attr) return null;
    const values = this.controlledValues.get(attr.code);
    return values ? Array.from(values) : null;
  }

  getAllCanonicalAttributes(): CanonicalSemanticAttribute[] {
    // Return unique attributes (exclude duplicate aliases like COMMUNITY.CASTE_CATEGORY pointing to same instance)
    const unique = new Map<string, CanonicalSemanticAttribute>();
    for (const attr of this.canonicalAttributes.values()) {
      unique.set(attr.code, attr);
    }
    return Array.from(unique.values());
  }

  getAllAliases(attributeCode?: string): SemanticAliasMapping[] {
    const result: SemanticAliasMapping[] = [];
    if (attributeCode) {
      const canonicalCode = this.resolveCanonicalCode(attributeCode) || attributeCode;
      const map = this.aliasRegistry.get(canonicalCode);
      if (map) {
        result.push(...Array.from(map.values()));
      }
    } else {
      for (const map of this.aliasRegistry.values()) {
        result.push(...Array.from(map.values()));
      }
    }
    return result;
  }

  /**
   * Deterministic resolution of raw input into a canonical semantic value.
   * NO PROBABILISTIC INFERENCE, NO EMBEDDINGS, NO LLM.
   */
  resolveCanonicalValue(attributeCodeOrKey: string, rawValue: unknown): SemanticResolutionResult {
    const attr = this.getCanonicalAttribute(attributeCodeOrKey);
    if (!attr) {
      return {
        resolved: false,
        canonicalValue: undefined,
        rawInput: rawValue,
        reason: 'UNRESOLVED_ALIAS',
        error: `Unknown semantic attribute: '${attributeCodeOrKey}'`,
      };
    }

    if (rawValue === null || rawValue === undefined) {
      return {
        resolved: false,
        canonicalAttributeCode: attr.code,
        canonicalValue: undefined,
        rawInput: rawValue,
        reason: 'INVALID_DATA_TYPE',
        error: `Value is null or undefined for attribute '${attr.code}'`,
      };
    }

    // If attribute is ENUM, check controlled values and explicit alias registry
    if (attr.dataType === AttributeDataType.ENUM) {
      if (typeof rawValue === 'object' && rawValue !== null) {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          reason: 'INVALID_DATA_TYPE',
          error: `Value for controlled enum '${attr.code}' cannot be an object. Explicit mapping required.`,
        };
      }

      const rawString = String(rawValue).trim();
      const normalizedString = rawString.toLowerCase();
      const controlled = this.controlledValues.get(attr.code);

      // Direct exact match with a controlled canonical value (case-insensitive)
      if (controlled) {
        for (const cv of controlled) {
          if (cv.toLowerCase() === normalizedString) {
            const aliasMapping = this.aliasRegistry.get(attr.code)?.get(normalizedString);
            return {
              resolved: true,
              canonicalAttributeCode: attr.code,
              canonicalValue: cv,
              canonicalUnit: null,
              rawInput: rawValue,
              normalizedInput: cv,
              appliedAliasId: aliasMapping?.id,
              reason: 'RESOLVED',
            };
          }
        }
      }

      // Check registered explicit aliases
      const attributeAliases = this.aliasRegistry.get(attr.code);
      if (attributeAliases && attributeAliases.has(normalizedString)) {
        const mapping = attributeAliases.get(normalizedString)!;

        // EXACT_LEXICAL_ALIAS: Unambiguous lexical translation resolves automatically
        if (mapping.aliasType === 'EXACT_LEXICAL_ALIAS') {
          return {
            resolved: true,
            canonicalAttributeCode: attr.code,
            canonicalValue: mapping.canonicalValue,
            canonicalUnit: null,
            rawInput: rawValue,
            normalizedInput: mapping.canonicalValue,
            appliedAliasId: mapping.id,
            reason: 'RESOLVED',
          };
        }

        // REQUIRES_CONTEXT / CONTEXTUAL_ALIAS: Rejected in context-free V1 runtime
        if (mapping.aliasType === 'REQUIRES_CONTEXT' || mapping.aliasType === 'CONTEXTUAL_ALIAS') {
          return {
            resolved: false,
            canonicalAttributeCode: attr.code,
            canonicalValue: undefined,
            rawInput: rawValue,
            normalizedInput: normalizedString,
            appliedAliasId: mapping.id,
            reason: 'CONTEXT_REQUIRED',
            error: `CONTEXT_REQUIRED: Alias '${rawString}' for attribute '${attr.code}' requires external context. Explicit mapping required.`,
          };
        }

        // AMBIGUOUS: Inherently ambiguous phrases rejected
        if (mapping.aliasType === 'AMBIGUOUS') {
          return {
            resolved: false,
            canonicalAttributeCode: attr.code,
            canonicalValue: undefined,
            rawInput: rawValue,
            normalizedInput: normalizedString,
            appliedAliasId: mapping.id,
            reason: 'AMBIGUOUS_ALIAS',
            error: `AMBIGUOUS_ALIAS: Input '${rawString}' is ambiguous for attribute '${attr.code}'. Explicit mapping required.`,
          };
        }
      }

      // Check known ambiguous phrase patterns that must return AMBIGUOUS_ALIAS
      if (
        normalizedString === 'business' ||
        normalizedString.includes('business worker') ||
        normalizedString.includes('business employee') ||
        normalizedString.includes('work in business') ||
        normalizedString.includes('company employee') ||
        normalizedString.includes('shop staff') ||
        normalizedString.includes('farm-related worker')
      ) {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          normalizedInput: normalizedString,
          reason: 'AMBIGUOUS_ALIAS',
          error: `AMBIGUOUS_ALIAS: Input '${rawString}' is ambiguous for attribute '${attr.code}'. Explicit mapping required.`,
        };
      }

      // Explicit non-inference: reject unmapped alias
      return {
        resolved: false,
        canonicalAttributeCode: attr.code,
        canonicalValue: undefined,
        rawInput: rawValue,
        normalizedInput: normalizedString,
        reason: 'UNRESOLVED_ALIAS',
        error: `UNRESOLVED_ALIAS: Unregistered semantic alias '${rawString}' for attribute '${attr.code}'. Explicit mapping required.`,
      };
    }

    // If attribute is NUMBER, validate numeric representation with strict NaN/Infinity checks
    if (attr.dataType === AttributeDataType.NUMBER) {
      if (typeof rawValue === 'boolean') {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          reason: 'INVALID_DATA_TYPE',
          error: `Boolean value '${rawValue}' is not a valid number for attribute '${attr.code}'`,
        };
      }
      const num = Number(rawValue);
      if (!Number.isFinite(num)) {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          reason: 'INVALID_DATA_TYPE',
          error: `Value '${rawValue}' cannot be parsed as a valid finite number for attribute '${attr.code}'`,
        };
      }
      return {
        resolved: true,
        canonicalAttributeCode: attr.code,
        canonicalValue: num,
        canonicalUnit: attr.canonicalUnit,
        rawInput: rawValue,
        normalizedInput: num,
        reason: 'RESOLVED',
      };
    }

    // If attribute is BOOLEAN
    if (attr.dataType === AttributeDataType.BOOLEAN) {
      if (typeof rawValue === 'object' && rawValue !== null) {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          reason: 'INVALID_DATA_TYPE',
          error: `Value for boolean attribute '${attr.code}' cannot be an object`,
        };
      }

      let boolVal: boolean | null = null;
      if (typeof rawValue === 'boolean') {
        boolVal = rawValue;
      } else if (typeof rawValue === 'string') {
        const s = rawValue.trim().toLowerCase();
        if (s === 'true' || s === 'yes' || s === '1') boolVal = true;
        else if (s === 'false' || s === 'no' || s === '0') boolVal = false;
      } else if (typeof rawValue === 'number') {
        if (rawValue === 1) boolVal = true;
        else if (rawValue === 0) boolVal = false;
      }

      if (boolVal === null) {
        return {
          resolved: false,
          canonicalAttributeCode: attr.code,
          canonicalValue: undefined,
          rawInput: rawValue,
          reason: 'INVALID_DATA_TYPE',
          error: `Value '${rawValue}' cannot be converted to boolean for attribute '${attr.code}'`,
        };
      }
      return {
        resolved: true,
        canonicalAttributeCode: attr.code,
        canonicalValue: boolVal,
        canonicalUnit: null,
        rawInput: rawValue,
        normalizedInput: boolVal,
        reason: 'RESOLVED',
      };
    }

    // Default TEXT/DATE
    return {
      resolved: true,
      canonicalAttributeCode: attr.code,
      canonicalValue: rawValue,
      canonicalUnit: attr.canonicalUnit,
      rawInput: rawValue,
      normalizedInput: String(rawValue).trim(),
      reason: 'RESOLVED',
    };
  }

  /**
   * Deterministic linear unit conversion.
   * Fixed precision: 6 decimal places for area, 2 decimal places for currency.
   * Strictly rejects regional units lacking jurisdictional context.
   */
  convertUnit(value: number, fromUnit: string, toUnit: string): { success: boolean; convertedValue?: number; error?: string } {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { success: false, error: 'Input value must be a valid finite number' };
    }

    // Extreme numerical boundary safety check
    if (Math.abs(value) > 1e12) {
      return { success: false, error: 'Input value exceeds maximum safe arithmetic boundary (1e12)' };
    }

    const normFrom = fromUnit.trim().toUpperCase();
    const normTo = toUnit.trim().toUpperCase();

    // Regional unit safety check (Remediation R4 & R7)
    if (this.regionalUnitsRequiringJurisdiction.has(normFrom) || this.regionalUnitsRequiringJurisdiction.has(normTo)) {
      const regUnit = this.regionalUnitsRequiringJurisdiction.has(normFrom) ? normFrom : normTo;
      return {
        success: false,
        error: `Regional unit '${regUnit}' requires explicit jurisdictional context (state/district) and cannot be converted using a universal multiplier in V1.`,
      };
    }

    if (normFrom === normTo) {
      return { success: true, convertedValue: value };
    }

    // Area conversions (Universal Base: HECTARE)
    if (this.areaConversionMultipliers.has(normFrom) && this.areaConversionMultipliers.has(normTo)) {
      const fromFactor = this.areaConversionMultipliers.get(normFrom)!;
      const toFactor = this.areaConversionMultipliers.get(normTo)!;
      // Convert to base (hectares), then to target
      const valueInBase = value * fromFactor;
      const converted = valueInBase / toFactor;
      // Fixed precision: Round to 6 decimal places to prevent floating point drift
      const rounded = Number(converted.toFixed(6));
      return { success: true, convertedValue: rounded };
    }

    // Currency conversions (Universal Base: INR)
    if (this.currencyConversionMultipliers.has(normFrom) && this.currencyConversionMultipliers.has(normTo)) {
      const fromFactor = this.currencyConversionMultipliers.get(normFrom)!;
      const toFactor = this.currencyConversionMultipliers.get(normTo)!;
      const valueInBase = value * fromFactor;
      const converted = valueInBase / toFactor;
      const rounded = Number(converted.toFixed(2));
      return { success: true, convertedValue: rounded };
    }

    // Cross-domain rejection
    if (
      (this.areaConversionMultipliers.has(normFrom) && this.currencyConversionMultipliers.has(normTo)) ||
      (this.currencyConversionMultipliers.has(normFrom) && this.areaConversionMultipliers.has(normTo))
    ) {
      return {
        success: false,
        error: `Cross-domain unit conversion not allowed: cannot convert from '${normFrom}' to '${normTo}'`,
      };
    }

    return {
      success: false,
      error: `Unsupported unit conversion from '${normFrom}' to '${normTo}'`,
    };
  }

  /**
   * Validate a value against canonical attribute rules.
   */
  validateAttributeValue(codeOrLegacyKey: string, value: unknown, _unit?: string): SemanticValidationResult {
    const attr = this.getCanonicalAttribute(codeOrLegacyKey);
    if (!attr) {
      return {
        isValid: false,
        errors: [`Unknown semantic attribute: '${codeOrLegacyKey}'`],
      };
    }

    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`Value for '${attr.code}' cannot be null or undefined.`);
      return { isValid: false, errors, canonicalAttribute: attr };
    }

    let normalizedValue: unknown = value;

    if (attr.dataType === AttributeDataType.NUMBER) {
      if (typeof value === 'boolean') {
        errors.push(`Value '${value}' is a boolean, not a valid number.`);
      } else {
        const num = Number(value);
        if (!Number.isFinite(num)) {
          errors.push(`Value '${value}' is not a valid finite number.`);
        } else {
          normalizedValue = num;
          if (attr.validationRules?.min !== undefined && num < attr.validationRules.min) {
            errors.push(`Value ${num} is less than minimum allowed ${attr.validationRules.min}.`);
          }
          if (attr.validationRules?.max !== undefined && num > attr.validationRules.max) {
            errors.push(`Value ${num} is greater than maximum allowed ${attr.validationRules.max}.`);
          }
        }
      }
    } else if (attr.dataType === AttributeDataType.ENUM) {
      if (typeof value === 'object' && value !== null) {
        errors.push(`Value for controlled enum '${attr.code}' cannot be an object.`);
      } else {
        const res = this.resolveCanonicalValue(attr.code, value);
        if (!res.resolved) {
          errors.push(res.error || `Invalid value for controlled enum '${attr.code}'.`);
        } else {
          normalizedValue = res.canonicalValue;
        }
      }
    } else if (attr.dataType === AttributeDataType.BOOLEAN) {
      if (typeof value === 'object' && value !== null) {
        errors.push(`Value for boolean attribute '${attr.code}' cannot be an object.`);
      } else {
        const res = this.resolveCanonicalValue(attr.code, value);
        if (!res.resolved) {
          errors.push(res.error || `Invalid value for boolean attribute '${attr.code}'.`);
        } else {
          normalizedValue = res.canonicalValue;
        }
      }
    } else if (attr.dataType === AttributeDataType.TEXT) {
      const str = String(value).trim();
      normalizedValue = str;
      if (attr.validationRules?.regex) {
        const re = new RegExp(attr.validationRules.regex);
        if (!re.test(str)) {
          errors.push(`Value does not match required pattern '${attr.validationRules.regex}'.`);
        }
      }
      if (attr.validationRules?.min !== undefined && str.length < attr.validationRules.min) {
        errors.push(`Length ${str.length} is less than minimum ${attr.validationRules.min}.`);
      }
      if (attr.validationRules?.max !== undefined && str.length > attr.validationRules.max) {
        errors.push(`Length ${str.length} exceeds maximum ${attr.validationRules.max}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      canonicalAttribute: attr,
      normalizedValue,
    };
  }
}
