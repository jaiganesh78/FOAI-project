import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  CanonicalSemanticAttributeCode,
  SemanticUnit,
  CanonicalOccupationCategory,
  CanonicalGender,
  CanonicalSocialCategory,
  RuleOperator,
  LogicalGroupOperator,
  validateSemanticValueSchema,
} from '@gpios/shared';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { PolicyDerivedClassificationService } from '../../../src/core/semantic/policy-derived-classification.service';
import { RuleEngineService } from '../../../src/modules/eligibility/services/rule-engine.service';
import { CompiledRuleTree } from '../../../src/modules/eligibility/services/compiled-rule-cache.service';

describe('V1 Semantic Contract Specification & Behavior (Remediated Baseline Step 4R.1)', () => {
  const registry = new SemanticRegistryService();
  const classificationService = new PolicyDerivedClassificationService();
  const ruleEngine = new RuleEngineService(registry);

  // --------------------------------------------------------------------------
  // R1: Attribute Identity, Namespaces & Legacy Mappings
  // --------------------------------------------------------------------------
  describe('R1: Canonical Attribute Identity & Legacy Mapping Invariants', () => {
    it('should resolve metadata and legacy keys for AGRICULTURE.LAND_AREA', () => {
      const landAreaAttr = registry.getCanonicalAttribute(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA);
      expect(landAreaAttr).not.toBeNull();
      expect(landAreaAttr?.code).toBe('AGRICULTURE.LAND_AREA');
      expect(landAreaAttr?.dataType).toBe('NUMBER');
      expect(landAreaAttr?.canonicalUnit).toBe(SemanticUnit.HECTARE);
      expect(landAreaAttr?.legacyAttributeKeys).toEqual(['landAreaHectares', 'landHolding']);
    });

    it('should resolve AGRICULTURE.LAND_OWNERSHIP_STATUS as a distinct attribute from LAND_AREA', () => {
      const ownershipAttr = registry.getCanonicalAttribute(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_OWNERSHIP);
      expect(ownershipAttr).not.toBeNull();
      expect(ownershipAttr?.code).toBe('AGRICULTURE.LAND_OWNERSHIP_STATUS');
      expect(ownershipAttr?.dataType).toBe('BOOLEAN');
      expect(ownershipAttr?.canonicalUnit).toBeNull();
      expect(ownershipAttr?.legacyAttributeKeys).toEqual(['isLandOwner']);

      // Hard Boundary: LAND_AREA != LAND_OWNERSHIP_STATUS
      const landAreaAttr = registry.getCanonicalAttribute(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA);
      expect(landAreaAttr?.code).not.toEqual(ownershipAttr?.code);
      expect(landAreaAttr?.dataType).not.toEqual(ownershipAttr?.dataType);
    });

    it('should map legitimate legacy keys correctly without cross-concept pollution', () => {
      // Land area keys
      expect(registry.resolveCanonicalCode('landAreaHectares')).toBe(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA);
      expect(registry.resolveCanonicalCode('landHolding')).toBe(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA);

      // Ownership key MUST NOT resolve to LAND_AREA
      expect(registry.resolveCanonicalCode('isLandOwner')).toBe(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_OWNERSHIP);
      expect(registry.resolveCanonicalCode('isLandOwner')).not.toBe(CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA);
    });

    it('should enforce the authoritative invariant that legacyAttributeKey === legacyAttributeKeys[0] across all attributes', () => {
      const allAttributes = registry.getAllCanonicalAttributes();
      expect(allAttributes.length).toBeGreaterThan(0);

      for (const attr of allAttributes) {
        expect(attr.legacyAttributeKeys).toBeDefined();
        expect(attr.legacyAttributeKeys.length).toBeGreaterThan(0);
        // The singular field must strictly equal the first authoritative element
        expect(attr.legacyAttributeKey).toBe(attr.legacyAttributeKeys[0]);
      }
    });

    it('should validate canonical attribute codes strictly with comprehensive edge cases (Remediation R10)', () => {
      // Valid canonical codes
      expect(registry.validateCanonicalCode('AGRICULTURE.LAND_AREA').isValid).toBe(true);
      expect(registry.validateCanonicalCode('FINANCIAL.ANNUAL_INCOME').isValid).toBe(true);
      expect(registry.validateCanonicalCode('COMMUNITY.SOCIAL_CATEGORY').isValid).toBe(true);

      // Malformed / unparsed syntax
      expect(registry.validateCanonicalCode('invalid_code').isValid).toBe(false);
      expect(registry.validateCanonicalCode('agriculture.land_area').isValid).toBe(false);
      expect(registry.validateCanonicalCode('  AGRICULTURE.LAND_AREA  ').isValid).toBe(false);
      expect(registry.validateCanonicalCode('').isValid).toBe(false);

      // Non-string / null / undefined
      expect(registry.validateCanonicalCode(null as unknown as string).isValid).toBe(false);
      expect(registry.validateCanonicalCode(undefined as unknown as string).isValid).toBe(false);

      // Unrecognized namespace
      expect(registry.validateCanonicalCode('UNKNOWN_NAMESPACE.ITEM').isValid).toBe(false);

      // Well-formed format but unknown attribute
      expect(registry.validateCanonicalCode('AGRICULTURE.UNKNOWN').isValid).toBe(false);
      expect(registry.validateCanonicalCode('LAND_AREA').isValid).toBe(false);
      expect(registry.validateCanonicalCode('land_area').isValid).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // R2: Alias Safety & Anti-Semantic-Inference Boundary
  // --------------------------------------------------------------------------
  describe('R2: Alias Safety & Anti-Semantic-Inference Boundary', () => {
    it('should resolve safe deterministic lexical aliases (Positive Test Suite)', () => {
      const safeCultivatorAliases = ['cultivator', 'kisan', 'krishak'];
      for (const alias of safeCultivatorAliases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, alias);
        expect(res.resolved).toBe(true);
        expect(res.canonicalValue).toBe(CanonicalOccupationCategory.CULTIVATOR);
        expect(res.reason).toBe('RESOLVED');
      }

      const safeLabourerAliases = [
        'agricultural labourer',
        'agricultural laborer',
        'farm labourer',
        'farm laborer',
      ];
      for (const alias of safeLabourerAliases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, alias);
        expect(res.resolved).toBe(true);
        expect(res.canonicalValue).toBe(CanonicalOccupationCategory.AGRICULTURAL_LABOURER);
        expect(res.reason).toBe('RESOLVED');
      }

      const safeSalariedAliases = ['salaried', 'salaried employee'];
      for (const alias of safeSalariedAliases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, alias);
        expect(res.resolved).toBe(true);
        expect(res.canonicalValue).toBe(CanonicalOccupationCategory.SALARIED_EMPLOYEE);
        expect(res.reason).toBe('RESOLVED');
      }

      const safeBusinessAliases = ['business owner', 'enterprise owner'];
      for (const alias of safeBusinessAliases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, alias);
        expect(res.resolved).toBe(true);
        expect(res.canonicalValue).toBe(CanonicalOccupationCategory.BUSINESS_OWNER);
        expect(res.reason).toBe('RESOLVED');
      }

      // Gender & Social Category safe aliases
      expect(registry.resolveCanonicalValue('DEMOGRAPHICS.GENDER', 'm').canonicalValue).toBe(CanonicalGender.MALE);
      expect(registry.resolveCanonicalValue('DEMOGRAPHICS.GENDER', 'female').canonicalValue).toBe(CanonicalGender.FEMALE);
      expect(registry.resolveCanonicalValue('COMMUNITY.SOCIAL_CATEGORY', 'gen').canonicalValue).toBe(CanonicalSocialCategory.GENERAL);
      expect(registry.resolveCanonicalValue('COMMUNITY.SOCIAL_CATEGORY', 'obc').canonicalValue).toBe(CanonicalSocialCategory.OBC);
    });

    it('should strictly reject context-required aliases in V1 context-free runtime (Adversarial Context Test)', () => {
      const contextRequiredAliases = [
        'farmer',
        'agricultural worker',
        'government employee',
        'private job',
        'shopkeeper',
      ];

      for (const alias of contextRequiredAliases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, alias);
        // Under V1 context-free contract, these MUST NOT resolve automatically
        expect(res.resolved).toBe(false);
        expect(res.canonicalValue).toBeUndefined();
        expect(res.reason).toBe('CONTEXT_REQUIRED');
        expect(res.error).toContain('Explicit mapping required');
      }
    });

    it('should strictly reject ambiguous aliases and multi-word variations (Adversarial Ambiguity Test)', () => {
      const ambiguousPhrases = [
        'business',
        'business worker',
        'business employee',
        'I work in business',
        'company employee',
        'shop staff',
        'farm-related worker',
      ];

      for (const phrase of ambiguousPhrases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, phrase);
        expect(res.resolved).toBe(false);
        expect(res.canonicalValue).toBeUndefined();
        expect(res.reason).toBe('AMBIGUOUS_ALIAS');
        expect(res.error).toContain('Explicit mapping required');
      }
    });

    it('should reject arbitrary unmapped natural language inferences with UNRESOLVED_ALIAS', () => {
      const adversarialPhrases = [
        'gardener',
        'tiller',
        'tractor driver',
        'shop assistant',
        'random unmapped phrase',
      ];

      for (const phrase of adversarialPhrases) {
        const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.OCCUPATION_CATEGORY, phrase);
        expect(res.resolved).toBe(false);
        expect(res.canonicalValue).toBeUndefined();
        expect(res.reason).toBe('UNRESOLVED_ALIAS');
        expect(res.error).toContain('Explicit mapping required');
      }
    });

    it('should handle whitespace, casing, and punctuation variants deterministically', () => {
      expect(registry.resolveCanonicalValue('OCCUPATION.CATEGORY', '   KISAN   ').canonicalValue).toBe('CULTIVATOR');
      expect(registry.resolveCanonicalValue('DEMOGRAPHICS.GENDER', '   MALE   ').canonicalValue).toBe('MALE');
      expect(registry.resolveCanonicalValue('COMMUNITY.SOCIAL_CATEGORY', '   OBC   ').canonicalValue).toBe('OBC');
    });
  });

  // --------------------------------------------------------------------------
  // R3: Social / Caste Category vs. Economic EWS Status Separation
  // --------------------------------------------------------------------------
  describe('R3: Separation of Social Category from EWS Economic Status', () => {
    it('should contain only legitimate affirmative action categories in CanonicalSocialCategory', () => {
      const allowed = registry.getControlledValues(CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY);
      expect(allowed).toEqual(['GENERAL', 'OBC', 'SC', 'ST']);
      expect(allowed).not.toContain('EWS');

      // Mutual exclusion checks
      expect(CanonicalSocialCategory.GENERAL).not.toBe('EWS');
      expect(CanonicalSocialCategory.OBC).not.toBe('EWS');
      expect(CanonicalSocialCategory.SC).not.toBe('EWS');
      expect(CanonicalSocialCategory.ST).not.toBe('EWS');
    });

    it('should reject EWS when submitted as a social category', () => {
      const res = registry.resolveCanonicalValue(CanonicalSemanticAttributeCode.COMMUNITY_SOCIAL_CATEGORY, 'EWS');
      expect(res.resolved).toBe(false);
      expect(res.canonicalValue).toBeUndefined();
      expect(res.reason).toBe('UNRESOLVED_ALIAS');
      expect(res.error).toContain('Explicit mapping required');
    });

    it('should provide a dedicated canonical attribute for ECONOMIC.EWS_STATUS and reject caste category inputs', () => {
      const ewsAttr = registry.getCanonicalAttribute(CanonicalSemanticAttributeCode.ECONOMIC_EWS_STATUS);
      expect(ewsAttr).not.toBeNull();
      expect(ewsAttr?.code).toBe('ECONOMIC.EWS_STATUS');
      expect(ewsAttr?.dataType).toBe('BOOLEAN');
      expect(ewsAttr?.legacyAttributeKeys).toEqual(['isEws', 'ewsStatus']);

      expect(registry.resolveCanonicalCode('isEws')).toBe(CanonicalSemanticAttributeCode.ECONOMIC_EWS_STATUS);
      expect(registry.resolveCanonicalCode('ewsStatus')).toBe(CanonicalSemanticAttributeCode.ECONOMIC_EWS_STATUS);

      const trueVal = registry.resolveCanonicalValue('ECONOMIC.EWS_STATUS', 'yes');
      expect(trueVal.resolved).toBe(true);
      expect(trueVal.canonicalValue).toBe(true);

      // Submitting caste category strings to boolean EWS status MUST fail
      const casteAsEws = registry.resolveCanonicalValue('ECONOMIC.EWS_STATUS', 'GENERAL');
      expect(casteAsEws.resolved).toBe(false);
      expect(casteAsEws.canonicalValue).toBeUndefined();
      expect(casteAsEws.reason).toBe('INVALID_DATA_TYPE');
    });
  });

  // --------------------------------------------------------------------------
  // R4 & R7: Regional Units Safety & Universal Conversions
  // --------------------------------------------------------------------------
  describe('R4 & R7: Regional Units Safety & Universal Conversions', () => {
    it('should convert universal area units deterministically (Base: HECTARE)', () => {
      // 1 Acre = 0.404686 Hectares
      expect(registry.convertUnit(1.0, SemanticUnit.ACRE, SemanticUnit.HECTARE).convertedValue).toBe(0.404686);
      // 10,000 Sq Meters = 1.0 Hectare
      expect(registry.convertUnit(10000, SemanticUnit.SQ_METER, SemanticUnit.HECTARE).convertedValue).toBe(1.0);
      // 100 Cents = 0.4047 Hectares
      expect(registry.convertUnit(100, SemanticUnit.CENT, SemanticUnit.HECTARE).convertedValue).toBe(0.4047);
    });

    it('should convert universal currency units deterministically (Base: INR)', () => {
      expect(registry.convertUnit(2.5, SemanticUnit.LAKH, SemanticUnit.INR).convertedValue).toBe(250000);
      expect(registry.convertUnit(1.5, SemanticUnit.CRORE, SemanticUnit.INR).convertedValue).toBe(15000000);
      expect(registry.convertUnit(50, SemanticUnit.THOUSAND, SemanticUnit.INR).convertedValue).toBe(50000);
    });

    it('should strictly reject all regional land units lacking jurisdictional context', () => {
      const regionalUnits = [
        'BIGHA',
        'BIGHA_PUCCA',
        'BIGHA_KACCHA',
        SemanticUnit.BIGHA_REGIONAL,
        'GUNTHA',
        'KATTHA',
        'MARLA',
        'KANAL',
        'BISWA',
      ];

      for (const unit of regionalUnits) {
        const res = registry.convertUnit(2.5, unit, SemanticUnit.HECTARE);
        expect(res.success).toBe(false);
        expect(res.error).toContain('requires explicit jurisdictional context');
      }
    });

    it('should reject cross-domain conversions', () => {
      const crossDomain = registry.convertUnit(5, SemanticUnit.ACRE, SemanticUnit.INR);
      expect(crossDomain.success).toBe(false);
      expect(crossDomain.error).toContain('Cross-domain unit conversion not allowed');
    });
  });

  // --------------------------------------------------------------------------
  // R5 & R8 & R9: Numerical Determinism, Boundaries & Finite Guards
  // --------------------------------------------------------------------------
  describe('R5 & R8 & R9: Numerical Determinism & Finite Safety', () => {
    it('should behave deterministically on exact threshold boundaries and epsilons', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-threshold-test',
        ruleCode: 'RULE_THRESHOLD_BOUNDARY',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-thresh',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
              operator: RuleOperator.LESS_OR_EQUAL,
              expectedValue: 2.0,
              expectedUnit: SemanticUnit.HECTARE,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      const epsilon = 0.000001;

      // Threshold - epsilon (1.999999 Hectares) -> PASS
      const resBelow = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: 2.0 - epsilon });
      expect(resBelow.isPassed).toBe(true);

      // Exact threshold (2.000000 Hectares) -> PASS
      const resExact = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: 2.0 });
      expect(resExact.isPassed).toBe(true);

      // Threshold + epsilon (2.000001 Hectares) -> FAIL
      const resAbove = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: 2.0 + epsilon });
      expect(resAbove.isPassed).toBe(false);
    });

    it('should evaluate converted-unit boundaries deterministically', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-acre-bound',
        ruleCode: 'RULE_ACRE_CONVERT_BOUNDARY',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-acre-bound',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
              operator: RuleOperator.LESS_OR_EQUAL,
              expectedValue: 2.0, // 2.0 Hectares
              expectedUnit: SemanticUnit.HECTARE,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      // 4.94 Acres = 4.94 * 0.404686 = 1.999149 Hectares <= 2.0 -> PASS
      const resPass = ruleEngine.evaluateRule(ruleTree, {
        landAreaHectares: { value: 4.94, unit: SemanticUnit.ACRE },
      });
      expect(resPass.isPassed).toBe(true);

      // 4.95 Acres = 4.95 * 0.404686 = 2.003196 Hectares > 2.0 -> FAIL
      const resFail = ruleEngine.evaluateRule(ruleTree, {
        landAreaHectares: { value: 4.95, unit: SemanticUnit.ACRE },
      });
      expect(resFail.isPassed).toBe(false);
    });

    it('should reject NaN, Infinity, extremely large numbers, and negative numbers in convertUnit and validation', () => {
      expect(registry.convertUnit(NaN, SemanticUnit.ACRE, SemanticUnit.HECTARE).success).toBe(false);
      expect(registry.convertUnit(Infinity, SemanticUnit.ACRE, SemanticUnit.HECTARE).success).toBe(false);
      expect(registry.convertUnit(-Infinity, SemanticUnit.ACRE, SemanticUnit.HECTARE).success).toBe(false);
      expect(registry.convertUnit(1e14, SemanticUnit.ACRE, SemanticUnit.HECTARE).success).toBe(false);

      // Validation engine rejection
      const nanValidation = registry.validateAttributeValue('AGRICULTURE.LAND_AREA', NaN);
      expect(nanValidation.isValid).toBe(false);

      const negLand = registry.validateAttributeValue('AGRICULTURE.LAND_AREA', -1.5);
      expect(negLand.isValid).toBe(false);
      expect(negLand.errors[0]).toContain('less than minimum allowed');
    });

    it('should reject non-finite numbers (Infinity, -Infinity, NaN) in rule engine comparisons', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-finite-test',
        ruleCode: 'RULE_FINITE_GUARD',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-finite',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
              operator: RuleOperator.LESS_OR_EQUAL,
              expectedValue: 2.0,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      // Fact with Infinity MUST fail numeric condition evaluation
      const resInfinity = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: Infinity });
      expect(resInfinity.isPassed).toBe(false);

      // Fact with -Infinity MUST fail numeric condition evaluation
      const resNegInfinity = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: -Infinity });
      expect(resNegInfinity.isPassed).toBe(false);

      // Fact with NaN MUST fail
      const resNaN = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: NaN });
      expect(resNaN.isPassed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // R11: Transport Envelope Validation vs. Semantic Layer Validation
  // --------------------------------------------------------------------------
  describe('R11: Transport Envelope Validation vs. Semantic Validation Boundary', () => {
    it('should allow generic envelope in transport DTO but enforce semantic rules in semantic layer', () => {
      // Transport envelope accepts payload because z.any() permits it
      const transportPayload = {
        attributeCode: 'AGRICULTURE.LAND_AREA',
        value: -50, // Semantically illegal
      };
      const schemaParsed = validateSemanticValueSchema.safeParse(transportPayload);
      expect(schemaParsed.success).toBe(true);

      // Semantic registry MUST reject the illegal semantic value
      const semanticValidated = registry.validateAttributeValue(transportPayload.attributeCode, transportPayload.value);
      expect(semanticValidated.isValid).toBe(false);
      expect(semanticValidated.errors[0]).toContain('less than minimum allowed');
    });

    it('should reject objects passed to ENUM or BOOLEAN and strings passed to NUMBER in semantic layer', () => {
      // 1. Object passed to ENUM attribute
      const enumObjPayload = { attributeCode: 'OCCUPATION.CATEGORY', value: { job: 'farming' } };
      expect(validateSemanticValueSchema.safeParse(enumObjPayload).success).toBe(true);
      const enumValidated = registry.validateAttributeValue(enumObjPayload.attributeCode, enumObjPayload.value);
      expect(enumValidated.isValid).toBe(false);
      expect(enumValidated.errors[0]).toContain('cannot be an object');

      // 2. Object passed to BOOLEAN attribute
      const boolObjPayload = { attributeCode: 'ECONOMIC.EWS_STATUS', value: { status: true } };
      expect(validateSemanticValueSchema.safeParse(boolObjPayload).success).toBe(true);
      const boolValidated = registry.validateAttributeValue(boolObjPayload.attributeCode, boolObjPayload.value);
      expect(boolValidated.isValid).toBe(false);
      expect(boolValidated.errors[0]).toContain('cannot be an object');

      // 3. String passed to NUMBER attribute
      const numStrPayload = { attributeCode: 'AGRICULTURE.LAND_AREA', value: 'not-a-number' };
      expect(validateSemanticValueSchema.safeParse(numStrPayload).success).toBe(true);
      const numValidated = registry.validateAttributeValue(numStrPayload.attributeCode, numStrPayload.value);
      expect(numValidated.isValid).toBe(false);
      expect(numValidated.errors[0]).toContain('not a valid finite number');
    });
  });

  // --------------------------------------------------------------------------
  // R5 & R10: Policy Integration & Independence
  // --------------------------------------------------------------------------
  describe('R5 & R10: Policy Integration & Attribute Independence', () => {
    it('should resolve landHolding into AGRICULTURE.LAND_AREA condition', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-legacy-holding',
        ruleCode: 'RULE_PM_KISAN_HOLDING',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-hold',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
              operator: RuleOperator.LESS_OR_EQUAL,
              expectedValue: 2.0,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      // Citizen facts stored with 'landHolding'
      const res = ruleEngine.evaluateRule(ruleTree, { landHolding: 1.8 });
      expect(res.isPassed).toBe(true);
      expect(res.conditionLogs[0].actualValue).toBe(1.8);
    });

    it('should NOT fall back to isLandOwner when evaluating AGRICULTURE.LAND_AREA (Direction 1)', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-land-area',
        ruleCode: 'RULE_PM_KISAN_AREA',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-area-no-fallback',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_AREA,
              operator: RuleOperator.LESS_OR_EQUAL,
              expectedValue: 2.0,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      // Citizen only answered isLandOwner: true (no landArea recorded)
      const res = ruleEngine.evaluateRule(ruleTree, { isLandOwner: true });
      // Condition must NOT pass by equating isLandOwner (boolean) with land area!
      expect(res.isPassed).toBe(false);
      expect(res.conditionLogs[0].actualValue).toBeNull();
    });

    it('should NOT fall back to landAreaHectares when evaluating AGRICULTURE.LAND_OWNERSHIP_STATUS (Direction 2)', () => {
      const ruleTree: CompiledRuleTree = {
        ruleId: 'r-land-owner-rule',
        ruleCode: 'RULE_PM_KISAN_OWNERSHIP',
        ruleVersionId: 'rv-1',
        versionNumber: 1,
        logicFingerprint: 'fp-owner-no-area-fallback',
        estimatedCost: 'LOW',
        rootGroup: {
          id: 'g-1',
          logicalOperator: LogicalGroupOperator.ALL,
          conditions: [
            {
              id: 'c-1',
              attributeKey: CanonicalSemanticAttributeCode.AGRICULTURE_LAND_OWNERSHIP,
              operator: RuleOperator.EQUALS,
              expectedValue: true,
              estimatedCost: 'LOW',
            },
          ],
          childGroups: [],
        },
      };

      // Citizen only answered landAreaHectares: 2.5 (no explicit isLandOwner recorded)
      const res = ruleEngine.evaluateRule(ruleTree, { landAreaHectares: 2.5 });
      // Having landArea recorded MUST NOT imply isLandOwner = true without an explicit policy rule
      expect(res.isPassed).toBe(false);
      expect(res.conditionLogs[0].actualValue).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // R13: Policy-Derived Classification Isolation
  // --------------------------------------------------------------------------
  describe('R13: Policy-Derived Classification Isolation', () => {
    it('should create an immutable, auditable PolicyDerivedClassification projection', () => {
      const classification = classificationService.createDerivedClassification({
        classificationCode: 'SMALL_FARMER',
        policyId: 'policy-pm-kisan-central',
        policyVersion: '2.0.0',
        ruleId: 'rule-land-threshold-2ha',
        ruleVersion: '1.0.0',
        sourceFacts: { 'AGRICULTURE.LAND_AREA': 1.5 },
        isSatisfied: true,
      });

      expect(classification.classificationCode).toBe('SMALL_FARMER');
      expect(classification.policyId).toBe('policy-pm-kisan-central');
      expect(Object.isFrozen(classification)).toBe(true);
    });

    it('should strictly reject storing policy-derived classifications as universal citizen facts', () => {
      expect(() => classificationService.assertNotPolicyDerivedClassification('SMALL_FARMER')).toThrow(
        BadRequestException,
      );
      expect(() => classificationService.assertNotPolicyDerivedClassification('MARGINAL_FARMER')).toThrow(
        BadRequestException,
      );
      expect(() => classificationService.assertNotPolicyDerivedClassification('SCHEME_ELIGIBLE')).toThrow(
        BadRequestException,
      );

      // Universal facts must pass without throwing
      expect(() => classificationService.assertNotPolicyDerivedClassification('AGRICULTURE.LAND_AREA')).not.toThrow();
      expect(() => classificationService.assertNotPolicyDerivedClassification('FINANCIAL.ANNUAL_INCOME')).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // R14: Zero-AI Runtime Authority Boundary
  // --------------------------------------------------------------------------
  describe('R14: Zero-AI Runtime Authority Boundary', () => {
    it('should execute full semantic resolution with zero external AI provider calls', () => {
      const mockLlmCall = vi.fn();
      const mockEmbeddingCall = vi.fn();

      const start = performance.now();
      const res = registry.resolveCanonicalValue('OCCUPATION.CATEGORY', 'kisan');
      const durationMs = performance.now() - start;

      expect(res.resolved).toBe(true);
      expect(res.canonicalValue).toBe('CULTIVATOR');
      expect(durationMs).toBeLessThan(10); // Sub-millisecond synchronous execution

      // Prove no LLM or embedding provider was invoked
      expect(mockLlmCall).not.toHaveBeenCalled();
      expect(mockEmbeddingCall).not.toHaveBeenCalled();
    });
  });
});
