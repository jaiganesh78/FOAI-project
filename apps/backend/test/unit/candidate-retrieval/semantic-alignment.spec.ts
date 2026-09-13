import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { SemanticAlignmentService } from '../../../src/modules/candidate-retrieval/services/semantic-alignment.service';

describe('SemanticAlignmentService (Sprint 12B)', () => {
  let registry: SemanticRegistryService;
  let alignmentService: SemanticAlignmentService;

  beforeEach(() => {
    registry = new SemanticRegistryService();
    alignmentService = new SemanticAlignmentService(registry);
  });

  describe('Exact Lexical Synonyms & Legacy Keys', () => {
    it('resolves exact approved occupation aliases to canonical values', () => {
      const result = alignmentService.alignCitizenFacts({
        primaryOccupation: 'cultivator',
      });

      expect(result.primaryOccupation).toBe('CULTIVATOR');
      expect(result.canonicalFacts['OCCUPATION.CATEGORY']).toBe('CULTIVATOR');
      expect(result.canonicalAttributesPresent).toContain('OCCUPATION.CATEGORY');
      expect(result.unresolvedInputs).toHaveLength(0);
    });

    it('resolves legacy attribute keys (annualIncome, landHolding) to canonical attributes', () => {
      const result = alignmentService.alignCitizenFacts({
        annualIncome: 150000,
        landHolding: 1.5,
      });

      expect(result.annualIncomeInr).toBe(150000);
      expect(result.landHoldingHectares).toBe(1.5);
      expect(result.canonicalFacts['FINANCIAL.ANNUAL_INCOME']).toBe(150000);
      expect(result.canonicalFacts['AGRICULTURE.LAND_AREA']).toBe(1.5);
      expect(result.canonicalAttributesPresent).toContain('FINANCIAL.ANNUAL_INCOME');
      expect(result.canonicalAttributesPresent).toContain('AGRICULTURE.LAND_AREA');
    });

    it('resolves gender and social category exact aliases', () => {
      const result = alignmentService.alignCitizenFacts({
        gender: 'female',
        casteCategory: 'obc',
      });

      expect(result.gender).toBe('FEMALE');
      expect(result.socialCategory).toBe('OBC');
      expect(result.canonicalFacts['DEMOGRAPHICS.GENDER']).toBe('FEMALE');
      expect(result.canonicalFacts['COMMUNITY.SOCIAL_CATEGORY']).toBe('OBC');
    });
  });

  describe('Context-Required & Ambiguous Inputs Refusal', () => {
    it('preserves context-required aliases (farmer, agricultural worker) in unresolvedInputs without guessing', () => {
      const result = alignmentService.alignCitizenFacts({
        occupation: 'farmer',
        secondJob: 'agricultural worker',
      });

      expect(result.primaryOccupation).toBeUndefined();
      expect(result.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
      expect(result.unresolvedInputs).toContain('occupation:farmer');
    });

    it('preserves ambiguous inputs (business, business worker) in ambiguousInputs without guessing', () => {
      const result = alignmentService.alignCitizenFacts({
        occupation: 'business worker',
      });

      expect(result.primaryOccupation).toBeUndefined();
      expect(result.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
      expect(result.ambiguousInputs).toContain('occupation:business worker');
    });
  });

  describe('Category Semantics Disambiguation (Clarification 2)', () => {
    it('strictly separates social category (caste) from EWS status (economic boolean)', () => {
      const result = alignmentService.alignCitizenFacts({
        casteCategory: 'general',
        isEws: true,
      });

      expect(result.socialCategory).toBe('GENERAL');
      expect(result.ewsStatus).toBe(true);
      expect(result.canonicalFacts['COMMUNITY.SOCIAL_CATEGORY']).toBe('GENERAL');
      expect(result.canonicalFacts['ECONOMIC.EWS_STATUS']).toBe(true);
      // Ensure caste is not EWS
      expect(result.socialCategory).not.toBe('EWS');
    });

    it('distinguishes beneficiary category from social category', () => {
      const result = alignmentService.alignCitizenFacts({
        casteCategory: 'sc',
        beneficiaryCategory: 'STUDENT',
      });

      expect(result.socialCategory).toBe('SC');
      expect(result.beneficiaryCategory).toBe('STUDENT');
    });
  });

  describe('Sensitive Data Boundary (PII Protection)', () => {
    it('strictly strips sensitive identifiers (Aadhaar, bank account, PAN) at ingress', () => {
      const result = alignmentService.alignCitizenFacts({
        state: 'Tamil Nadu',
        annualIncome: 120000,
        aadhaarNumber: '1234-5678-9012',
        bankAccountNumber: '9876543210',
        panNumber: 'ABCDE1234F',
      });

      expect(result.state).toBe('Tamil Nadu');
      expect(result.annualIncomeInr).toBe(120000);

      // Verify sensitive data is completely purged
      const jsonString = JSON.stringify(result);
      expect(jsonString).not.toContain('1234-5678-9012');
      expect(jsonString).not.toContain('9876543210');
      expect(jsonString).not.toContain('ABCDE1234F');
      expect(result.unresolvedInputs).toHaveLength(0); // not even preserved as unresolved
    });
  });

  describe('Scalable Generic Canonical Attribute Representation & Fail-Closed Integrity (R5)', () => {
    it('preserves generic canonicalFacts map for registered canonical attributes', () => {
      const result = alignmentService.alignCitizenFacts({
        'DISABILITY.BENCHMARK_STATUS': true,
        'AGRICULTURE.LAND_OWNERSHIP_STATUS': true,
      });

      expect(result.canonicalFacts['DISABILITY.BENCHMARK_STATUS']).toBe(true);
      expect(result.canonicalFacts['AGRICULTURE.LAND_OWNERSHIP_STATUS']).toBe(true);
      expect(result.canonicalAttributesPresent).toContain('DISABILITY.BENCHMARK_STATUS');
      expect(result.canonicalAttributesPresent).toContain('AGRICULTURE.LAND_OWNERSHIP_STATUS');
    });

    it('fails closed on unknown dotted keys or fake canonical attributes (R5)', () => {
      const result = alignmentService.alignCitizenFacts({
        'DISABILITY.PERCENTAGE': 45,
        'FAKE.NEW_ATTRIBUTE': 'malicious_override',
        'agriculture.land_area': 1.5, // lowercase canonical code must not bypass registry
      });

      expect(result.canonicalFacts['DISABILITY.PERCENTAGE']).toBeUndefined();
      expect(result.canonicalFacts['FAKE.NEW_ATTRIBUTE']).toBeUndefined();
      expect(result.canonicalFacts['agriculture.land_area']).toBeUndefined();
      expect(result.canonicalAttributesPresent).toHaveLength(0);
      expect(result.unresolvedInputs).toContain('DISABILITY.PERCENTAGE:45');
      expect(result.unresolvedInputs).toContain('FAKE.NEW_ATTRIBUTE:malicious_override');
      expect(result.unresolvedInputs).toContain('agriculture.land_area:1.5');
    });
  });
});
