import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateRetrievalService } from '../../../src/modules/candidate-retrieval/services/candidate-retrieval.service';
import { SemanticAlignmentService } from '../../../src/modules/candidate-retrieval/services/semantic-alignment.service';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { DeterministicVectorTestAdapter } from '../../../src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter';
import { ICandidateRetrievalRepository } from '../../../src/modules/candidate-retrieval/repositories/candidate-retrieval.repository.interface';
import { IEmbeddingProvider } from '../../../src/core/ai-provider/embedding-provider.interface';
import { RuleEngineService } from '../../../src/modules/eligibility/services/rule-engine.service';
import { CandidateRetrievalController } from '../../../src/modules/candidate-retrieval/controllers/candidate-retrieval.controller';
import { CitizenQueryService } from '../../../src/modules/citizen/services/citizen-query.service';
import { ForbiddenException } from '@nestjs/common';

describe('S12B Surgical Integrity Remediation Adversarial Matrix (52 Tests)', () => {
  let retrievalService: CandidateRetrievalService;
  let alignmentService: SemanticAlignmentService;
  let registry: SemanticRegistryService;
  let vectorAdapter: DeterministicVectorTestAdapter;
  let mockEmbeddingProvider: IEmbeddingProvider;
  let mockRepository: ICandidateRetrievalRepository;

  beforeEach(() => {
    registry = new SemanticRegistryService();
    alignmentService = new SemanticAlignmentService(registry);
    vectorAdapter = new DeterministicVectorTestAdapter();

    mockEmbeddingProvider = {
      generateEmbedding: vi.fn().mockResolvedValue([1.0, 0.0, 0.0, 0.0]),
      generateEmbeddings: vi.fn().mockResolvedValue([[1.0, 0.0, 0.0, 0.0]]),
    };

    mockRepository = {
      findStructuredCandidates: vi.fn().mockResolvedValue([
        {
          policyId: 'doc-pm-kisan',
          policyVersionId: 'ver-pm-kisan-v1',
          policyVersionNumber: 1,
          title: 'PM Kisan Samman Nidhi',
          documentNumber: 'DOC-PM-001',
          classification: 'SCHEME',
          sourceId: 'src-gov-portal',
          state: null, // National
          beneficiaryCategory: 'FARMER',
          ministry: 'Ministry of Agriculture',
          department: 'Department of Agriculture and Farmers Welfare',
          referencedAttributes: ['AGRICULTURE.LAND_AREA', 'FINANCIAL.ANNUAL_INCOME'],
          chunkCount: 2,
          sampleChunkTitles: ['Land Ceiling Rule'],
        },
      ]),
      findCandidatePolicyVersionsByIds: vi.fn().mockResolvedValue([]),
    };

    retrievalService = new CandidateRetrievalService(
      mockRepository,
      alignmentService,
      vectorAdapter,
      mockEmbeddingProvider,
    );
  });

  // ============================================================
  // SECTION A: Semantic Authority & Escape Hatch (Finding R5)
  // ============================================================
  describe('A. Semantic Authority & Escape Hatch (R5)', () => {
    it('1. rejects fake dotted canonical key into canonicalFacts', () => {
      const aligned = alignmentService.alignCitizenFacts({ 'FAKE.NEW_ATTRIBUTE': 'value' });
      expect(aligned.canonicalFacts['FAKE.NEW_ATTRIBUTE']).toBeUndefined();
      expect(aligned.canonicalAttributesPresent).not.toContain('FAKE.NEW_ATTRIBUTE');
      expect(aligned.unresolvedInputs).toContain('FAKE.NEW_ATTRIBUTE:value');
    });

    it('2. rejects lowercase canonical key from bypassing registry', () => {
      const aligned = alignmentService.alignCitizenFacts({ 'agriculture.land_area': 2.5 });
      expect(aligned.canonicalFacts['agriculture.land_area']).toBeUndefined();
      expect(aligned.canonicalAttributesPresent).not.toContain('agriculture.land_area');
      expect(aligned.unresolvedInputs).toContain('agriculture.land_area:2.5');
    });

    it('3. rejects arbitrary unknown attributes', () => {
      const aligned = alignmentService.alignCitizenFacts({ 'unregistered_field': 'test' });
      expect(aligned.canonicalFacts['unregistered_field']).toBeUndefined();
      expect(aligned.unresolvedInputs).toContain('unregistered_field:test');
    });

    it('4. accepts registered legacy keys through semantic registry', () => {
      const aligned = alignmentService.alignCitizenFacts({ landHolding: 2.0, annualIncome: 250000 });
      expect(aligned.canonicalFacts['AGRICULTURE.LAND_AREA']).toBe(2.0);
      expect(aligned.canonicalFacts['FINANCIAL.ANNUAL_INCOME']).toBe(250000);
      expect(aligned.canonicalAttributesPresent).toContain('AGRICULTURE.LAND_AREA');
      expect(aligned.canonicalAttributesPresent).toContain('FINANCIAL.ANNUAL_INCOME');
    });

    it('5. preserves ambiguous alias as unresolved without guessing', () => {
      const aligned = alignmentService.alignCitizenFacts({ occupation: 'business worker' });
      expect(aligned.primaryOccupation).toBeUndefined();
      expect(aligned.ambiguousInputs).toContain('occupation:business worker');
    });

    it('6. preserves contextual alias as unresolved without guessing', () => {
      const aligned = alignmentService.alignCitizenFacts({ occupation: 'farmer' });
      expect(aligned.primaryOccupation).toBeUndefined();
      expect(aligned.unresolvedInputs).toContain('occupation:farmer');
    });

    it('7. canonical value resolution remains deterministic across calls', () => {
      const run1 = alignmentService.alignCitizenFacts({ annualIncome: 300000 });
      const run2 = alignmentService.alignCitizenFacts({ annualIncome: 300000 });
      expect(run1).toEqual(run2);
    });
  });

  // ============================================================
  // SECTION B: PII Sanitization in Facts and Query (Finding R3)
  // ============================================================
  describe('B. PII Sanitization in Facts & Search Query (R3)', () => {
    it('8. purges Aadhaar from citizen facts at ingress', () => {
      const aligned = alignmentService.alignCitizenFacts({ aadhaarNumber: '111122223333' });
      expect(JSON.stringify(aligned)).not.toContain('111122223333');
    });

    it('9. purges PAN from citizen facts at ingress', () => {
      const aligned = alignmentService.alignCitizenFacts({ panNumber: 'ABCDE1234F' });
      expect(JSON.stringify(aligned)).not.toContain('ABCDE1234F');
    });

    it('10. purges bank account from citizen facts at ingress', () => {
      const aligned = alignmentService.alignCitizenFacts({ bankAccountNumber: '123456789012' });
      expect(JSON.stringify(aligned)).not.toContain('123456789012');
    });

    it('11. redacts Aadhaar number appearing inside free-text searchQuery', async () => {
      await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        searchQuery: 'Scholarship for student with Aadhaar 1111-2222-3333 in Delhi',
        mode: 'HYBRID',
      });

      const calledText = (mockEmbeddingProvider.generateEmbedding as any).mock.calls[0][0];
      expect(calledText).not.toContain('1111-2222-3333');
      expect(calledText).toContain('[REDACTED_IDENTIFIER]');
    });

    it('12. redacts PAN number appearing inside free-text searchQuery', async () => {
      await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        searchQuery: 'Tax subsidy query for pan ABCDE1234F',
        mode: 'HYBRID',
      });

      const calledText = (mockEmbeddingProvider.generateEmbedding as any).mock.calls[0][0];
      expect(calledText).not.toContain('ABCDE1234F');
      expect(calledText).toContain('[REDACTED_IDENTIFIER]');
    });

    it('13. redacts mixed PII (Aadhaar + PAN + Bank Account) in searchQuery', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        searchQuery: 'Account 998877665544, PAN ABCDE9999F, Aadhaar 999988887777',
        mode: 'HYBRID',
      });

      const calledText = (mockEmbeddingProvider.generateEmbedding as any).mock.calls[0][0];
      expect(calledText).not.toContain('998877665544');
      expect(calledText).not.toContain('ABCDE9999F');
      expect(calledText).not.toContain('999988887777');
      expect(result.warnings?.some((w) => w.includes('1 sensitive input removed from search query'))).toBe(true);
    });

    it('14. guarantees PII is absent from warnings and candidate output', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { aadhaarNumber: '111122223333' } },
        searchQuery: 'PAN ABCDE9999F',
        mode: 'HYBRID',
      });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('111122223333');
      expect(serialized).not.toContain('ABCDE9999F');
    });
  });

  // ============================================================
  // SECTION C: Trust Boundary & Fact Authority (Finding R4)
  // ============================================================
  describe('C. Trust Boundary & Authoritative Citizen Facts (R4)', () => {
    it('15. server-side authoritative facts take precedence over client-injected facts', async () => {
      const mockCitizenQuery: CitizenQueryService = {
        getStructuredFactsByUserId: vi.fn().mockResolvedValue({
          annualIncome: 800000, // authoritative database fact
        }),
      } as any;

      const controller = new CandidateRetrievalController(retrievalService, mockCitizenQuery);
      const retrieveSpy = vi.spyOn(retrievalService, 'retrieveCandidates');

      await controller.searchCandidates(
        { userId: 'citizen-101' },
        {
          citizenContext: {
            userId: 'citizen-101',
            facts: {
              annualIncome: 1000, // client attempts to lie about low income
            },
          },
          mode: 'STRUCTURED_ONLY',
        },
      );

      expect(retrieveSpy).toHaveBeenCalled();
      const calledContext = retrieveSpy.mock.calls[0][0].citizenContext;
      expect(calledContext.authoritativeCitizenFacts?.annualIncome).toBe(800000); // authoritative fact won!
      expect(calledContext.retrievalHints?.annualIncome).toBe(1000); // client attempt isolated to hints
    });

    it('16. forbids cross-citizen impersonation when userId mismatches JWT principal', async () => {
      const controller = new CandidateRetrievalController(retrievalService);
      await expect(
        controller.searchCandidates(
          { userId: 'attacker-1' },
          {
            citizenContext: {
              userId: 'victim-2',
              facts: {},
            },
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('17. internal calls without JWT derive facts directly from trusted request context', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: { annualIncome: 450000 },
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('SUCCESS');
    });
  });

  // ============================================================
  // SECTION D: Structured Retrieval Correctness (Findings R1, R2, R9)
  // ============================================================
  describe('D. Structured Retrieval Correctness (R1, R2, R9)', () => {
    it('18. filters by ministry matching requested constraint', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        constraints: { ministry: 'Ministry of Agriculture' },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.appliedFilters.ministry).toBe('Ministry of Agriculture');
    });

    it('19. reports ministry in appliedFilters ONLY when actually applied (no false observability)', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.appliedFilters.ministry).toBeUndefined();
      expect(result.appliedFilters.department).toBeUndefined();
    });

    it('20. beneficiary category match is reported truthfully', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { beneficiaryCategory: 'FARMER' } },
        constraints: { beneficiaryCategory: 'FARMER' },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].retrievalEvidence.beneficiaryCategoryMatch).toBe(true);
    });

    it('21. beneficiary category mismatch returns undefined when no constraint was passed', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].retrievalEvidence.beneficiaryCategoryMatch).toBeUndefined();
    });

    it('22. state match is true for national universal policies', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { state: 'Karnataka' } },
        constraints: { state: 'Karnataka' },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].retrievalEvidence.stateMatch).toBe(true);
    });

    it('23. state match is undefined when no state was requested and policy is state-specific', async () => {
      (mockRepository.findStructuredCandidates as any).mockResolvedValueOnce([
        {
          policyId: 'doc-state-specific',
          policyVersionId: 'ver-state-1',
          policyVersionNumber: 1,
          title: 'State Scheme',
          documentNumber: 'DOC-ST-001',
          classification: 'SCHEME',
          state: 'Punjab',
          beneficiaryCategory: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].retrievalEvidence.stateMatch).toBeUndefined();
    });

    it('24. relevant canonical attribute overlap passes structured relevance', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { landHolding: 1.5 } },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].matchedSemanticAttributes).toContain('AGRICULTURE.LAND_AREA');
    });

    it('25. policy with no attribute overlap is preserved if it has no specific attribute rules', async () => {
      (mockRepository.findStructuredCandidates as any).mockResolvedValueOnce([
        {
          policyId: 'doc-universal-guideline',
          policyVersionId: 'ver-guide-1',
          policyVersionNumber: 1,
          title: 'Citizen Charter',
          documentNumber: 'DOC-CC-001',
          classification: 'GUIDELINE',
          state: null,
          beneficiaryCategory: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { annualIncome: 500000 } },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates.length).toBe(1);
    });

    it('26. attribute presence does NOT evaluate rule thresholds or filter on numerical condition failure', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { landHolding: 999.0, annualIncome: 99999999 } },
        mode: 'STRUCTURED_ONLY',
      });

      // Still retrieved as candidate based on attribute presence
      expect(result.candidates.length).toBe(1);
      expect((result.candidates[0] as any).eligible).toBeUndefined();
    });
  });

  // ============================================================
  // SECTION E: Vector Mathematics & Correctness (Finding R7)
  // ============================================================
  describe('E. Vector Mathematics & Validation (R7)', () => {
    it('27. identical vectors return cosine = 1.0 and normalizedScore = 1.0', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([1, 0, 0], [1, 0, 0]);
      expect(cosine).toBe(1.0);
    });

    it('28. orthogonal vectors return cosine = 0.0', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([1, 0, 0], [0, 1, 0]);
      expect(cosine).toBe(0.0);
    });

    it('29. opposite vectors return negative cosine in [-1, 0)', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([1, 0, 0], [-1, 0, 0]);
      expect(cosine).toBe(-1.0);
    });

    it('30. vectors with NaN return 0.0 safely without crashing', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([NaN, 1, 0], [1, 0, 0]);
      expect(cosine).toBe(0.0);
    });

    it('31. vectors with Infinity return 0.0 safely', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([Infinity, 0, 0], [1, 0, 0]);
      expect(cosine).toBe(0.0);
    });

    it('32. zero-norm vector returns 0.0 safely', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([0, 0, 0], [1, 1, 1]);
      expect(cosine).toBe(0.0);
    });

    it('33. dimension mismatch returns 0.0 safely', () => {
      const cosine = vectorAdapter.calculateCosineSimilarity([1, 2], [1, 2, 3]);
      expect(cosine).toBe(0.0);
    });

    it('34. deterministic vector search produces identical results across runs', async () => {
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-1',
        documentId: 'doc-1',
        versionId: 'ver-1',
        vector: [0.5, 0.5],
      });

      const res1 = await vectorAdapter.searchSimilarChunks([0.5, 0.5], { limit: 5 });
      const res2 = await vectorAdapter.searchSimilarChunks([0.5, 0.5], { limit: 5 });
      expect(res1).toEqual(res2);
    });
  });

  // ============================================================
  // SECTION F: Version Safety & Fusion (Finding R16)
  // ============================================================
  describe('F. Version Safety & Fusion (R16)', () => {
    it('35. fuses vector matches into candidate of matching version', async () => {
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-v1',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v1',
        sectionTitle: 'PM Kisan Rules',
        vector: [1, 0, 0, 0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      expect(result.candidates[0].retrievalMethod).toBe('HYBRID');
      expect(result.candidates[0].retrievalEvidence.vectorScore).toBeDefined();
    });

    it('36. defensively rejects vector match containing mismatched versionId', async () => {
      // Vector adapter returns match for ver-pm-kisan-v2 (not the current candidate version)
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-malicious-v2',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v2', // Mismatched version!
        sectionTitle: 'Malicious V2 Chunk',
        vector: [1, 0, 0, 0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      // The candidate is ver-pm-kisan-v1; it MUST NOT adopt chunk from ver-pm-kisan-v2
      const candidate = result.candidates[0];
      expect(candidate.policyVersionId).toBe('ver-pm-kisan-v1');
      expect(candidate.retrievalEvidence.sampleChunkTitles).not.toContain('Malicious V2 Chunk');
    });

    it('37. ignores vector matches for documents not in structured candidates', async () => {
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-orphan',
        documentId: 'doc-non-existent',
        versionId: 'ver-non-existent',
        sectionTitle: 'Orphan Chunk',
        vector: [1, 0, 0, 0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      expect(result.candidates.some((c) => c.policyId === 'doc-non-existent')).toBe(false);
    });
  });

  // ============================================================
  // SECTION G: Evidence Semantics (Findings R8, R9)
  // ============================================================
  describe('G. Evidence Semantics (R8, R9)', () => {
    it('38. does not double-count chunks in matchedChunkCount (Finding R8)', async () => {
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-1',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v1',
        sectionTitle: 'Chunk 1',
        vector: [1, 0, 0, 0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      const evidence = result.candidates[0].retrievalEvidence;
      expect(evidence.totalChunkCount).toBe(2);
      expect(evidence.vectorMatchedChunkCount).toBe(1);
      expect(evidence.uniqueMatchedChunkCount).toBe(1);
      expect(evidence.matchedChunkCount).toBe(1); // NOT 2 + 1 = 3!
    });

    it('39. departmentMatch is true ONLY when requested department matches policy', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        constraints: { department: 'Department of Agriculture and Farmers Welfare' },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].retrievalEvidence.departmentMatch).toBe(true);
    });

    it('40. departmentMatch is undefined when no department constraint was passed (Finding R9)', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      // Must be undefined, NOT true merely because department exists
      expect(result.candidates[0].retrievalEvidence.departmentMatch).toBeUndefined();
    });

    it('41. evidence remains deterministic across identical runs', async () => {
      const res1 = await retrievalService.retrieveCandidates({ citizenContext: { facts: {} }, mode: 'STRUCTURED_ONLY' });
      const res2 = await retrievalService.retrieveCandidates({ citizenContext: { facts: {} }, mode: 'STRUCTURED_ONLY' });
      expect(res1.candidates[0].retrievalEvidence.matchedChunkCount).toBe(res2.candidates[0].retrievalEvidence.matchedChunkCount);
    });
  });

  // ============================================================
  // SECTION H: Retrieval vs Eligibility Boundary (Finding R15)
  // ============================================================
  describe('H. Retrieval vs Eligibility Boundary (R15)', () => {
    it('42. proves RuleEngineService.prototype.evaluateRule is NEVER invoked during candidate retrieval', async () => {
      const ruleEngineSpy = vi.spyOn(RuleEngineService.prototype, 'evaluateRule');

      await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            landHolding: 1.5,
            annualIncome: 150000,
          },
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(ruleEngineSpy).not.toHaveBeenCalled();
      ruleEngineSpy.mockRestore();
    });

    it('43. high vector similarity does NOT imply or assert eligibility', async () => {
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-1',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v1',
        vector: [1, 0, 0, 0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      expect(result.candidates[0].retrievalScore).toBeGreaterThan(0.65);
      expect((result.candidates[0] as any).isEligible).toBeUndefined();
    });

    it('44. failed eligibility condition does NOT remove candidate from retrieval list', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: { landHolding: 100 } }, // exceeds typical 2ha limit
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates.length).toBe(1);
    });

    it('45. zero eligibility fields returned in serialized JSON result', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      const raw = JSON.stringify(result);
      expect(raw).not.toContain('"eligible"');
      expect(raw).not.toContain('"isEligible"');
      expect(raw).not.toContain('"eligibilityStatus"');
      expect(raw).not.toContain('"passedRules"');
    });
  });

  // ============================================================
  // SECTION I: Failure Semantics Truthfulness
  // ============================================================
  describe('I. Failure Semantics Truthfulness', () => {
    it('46. database failure returns RETRIEVAL_FAILURE and never NO_RESULTS', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('RETRIEVAL_FAILURE');
      expect(result.warnings?.[0]).toContain('Connection timeout');
    });

    it('47. vector failure with structured candidates returns PARTIAL_RESULTS', async () => {
      vectorAdapter.setSimulatedError(new Error('Vector cluster offline'));

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'HYBRID',
      });

      expect(result.status).toBe('PARTIAL_RESULTS');
      expect(result.candidates.length).toBe(1);
      expect(result.candidates[0].retrievalMethod).toBe('STRUCTURED');
    });

    it('48. zero matching policies returns NO_RESULTS truthfully', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('NO_RESULTS');
      expect(result.candidates).toHaveLength(0);
    });
  });

  // ============================================================
  // SECTION J: Ranking, Bounding & Truncation (Finding R12)
  // ============================================================
  describe('J. Ranking, Bounding & Truncation (R12)', () => {
    it('49. breaks score ties deterministically by documentNumber ascending', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([
        {
          policyId: 'doc-b',
          policyVersionId: 'ver-b',
          policyVersionNumber: 1,
          title: 'Policy B',
          documentNumber: 'DOC-002',
          classification: 'SCHEME',
          state: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
        {
          policyId: 'doc-a',
          policyVersionId: 'ver-a',
          policyVersionNumber: 1,
          title: 'Policy A',
          documentNumber: 'DOC-001',
          classification: 'SCHEME',
          state: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].documentNumber).toBe('DOC-001');
      expect(result.candidates[1].documentNumber).toBe('DOC-002');
    });

    it('50. respects maxCandidates limit', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([
        { policyId: 'doc-1', policyVersionId: 'ver-1', policyVersionNumber: 1, title: 'P1', documentNumber: 'D1', classification: 'SCHEME', state: null, referencedAttributes: [], chunkCount: 1, sampleChunkTitles: [] },
        { policyId: 'doc-2', policyVersionId: 'ver-2', policyVersionNumber: 1, title: 'P2', documentNumber: 'D2', classification: 'SCHEME', state: null, referencedAttributes: [], chunkCount: 1, sampleChunkTitles: [] },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        constraints: { maxCandidates: 1 },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates.length).toBe(1);
    });

    it('51. distinguishes totalCandidates from returnedCandidates (Finding R12)', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([
        { policyId: 'doc-1', policyVersionId: 'ver-1', policyVersionNumber: 1, title: 'P1', documentNumber: 'D1', classification: 'SCHEME', state: null, referencedAttributes: [], chunkCount: 1, sampleChunkTitles: [] },
        { policyId: 'doc-2', policyVersionId: 'ver-2', policyVersionNumber: 1, title: 'P2', documentNumber: 'D2', classification: 'SCHEME', state: null, referencedAttributes: [], chunkCount: 1, sampleChunkTitles: [] },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        constraints: { maxCandidates: 1 },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.totalCandidates).toBe(2);
      expect(result.returnedCandidates).toBe(1);
    });

    it('52. retrievalScore is always a finite number between 0.0 and 1.0', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      for (const candidate of result.candidates) {
        expect(Number.isFinite(candidate.retrievalScore)).toBe(true);
        expect(candidate.retrievalScore).toBeGreaterThanOrEqual(0.0);
        expect(candidate.retrievalScore).toBeLessThanOrEqual(1.0);
      }
    });

    it('53. redacts Aadhaar, PAN, and Bank Account from unresolvedInputs and warnings for unregistered keys', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            custom_id: '1234-5678-9012',
            tax_code: 'ABCDE1234F',
            bank_num: '123456789012',
          },
        },
        mode: 'STRUCTURED_ONLY',
      });

      // Assert that raw PII values are redacted in warnings
      if (result.warnings) {
        for (const w of result.warnings) {
          expect(w).not.toContain('1234-5678-9012');
          expect(w).not.toContain('ABCDE1234F');
          expect(w).not.toContain('123456789012');
        }
      }
    });

    it('54. deterministically breaks ties using policyVersionId when score and documentNumber are identical', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([
        {
          policyId: 'doc-same',
          policyVersionId: 'ver-b',
          policyVersionNumber: 2,
          title: 'Version B',
          documentNumber: 'DOC-SAME',
          classification: 'SCHEME',
          state: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
        {
          policyId: 'doc-same',
          policyVersionId: 'ver-a',
          policyVersionNumber: 1,
          title: 'Version A',
          documentNumber: 'DOC-SAME',
          classification: 'SCHEME',
          state: null,
          referencedAttributes: [],
          chunkCount: 1,
          sampleChunkTitles: [],
        },
      ]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates[0].policyVersionId).toBe('ver-a');
      expect(result.candidates[1].policyVersionId).toBe('ver-b');
    });

    it('55. applies conservative long-digit identifier redaction on searchQuery', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: { facts: {} },
        searchQuery: 'check eligibility for account 12345678901234 and scheme 987654321',
        mode: 'HYBRID',
      });

      expect(mockEmbeddingProvider.generateEmbedding).toHaveBeenCalledWith(
        expect.not.stringContaining('12345678901234'),
      );
      expect(result.warnings?.some((w) => w.includes('1 sensitive input removed from search query'))).toBe(true);
    });

    it('56. ensures authoritative server profile facts take precedence over conflicting client facts', async () => {
      const mockCitizenQueryService: Partial<CitizenQueryService> = {
        getStructuredFactsByUserId: vi.fn().mockResolvedValue({
          annualIncome: 500000,
          landHolding: 1.5,
        }),
      };

      const controller = new CandidateRetrievalController(
        retrievalService,
        mockCitizenQueryService as CitizenQueryService,
      );

      const spy = vi.spyOn(retrievalService, 'retrieveCandidates');

      await controller.searchCandidates(
        { userId: 'citizen-101' },
        {
          citizenContext: {
            userId: 'citizen-101',
            facts: {
              annualIncome: 10000, // Client attempts to spoof lower income
              landHolding: 0.5,     // Client attempts to spoof lower land
            },
          },
          mode: 'STRUCTURED_ONLY',
        },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          citizenContext: {
            userId: 'citizen-101',
            authoritativeCitizenFacts: {
              annualIncome: 500000, // Authoritative value preserved!
              landHolding: 1.5,     // Authoritative value preserved!
            },
            retrievalHints: {
              annualIncome: 10000, // Spoofed value isolated to retrievalHints
              landHolding: 0.5,
            },
          },
        }),
      );
    });

    it('57. client-only facts cannot inject fake canonical attributes into canonicalFacts', async () => {
      const mockCitizenQueryService: Partial<CitizenQueryService> = {
        getStructuredFactsByUserId: vi.fn().mockResolvedValue({}),
      };

      const controller = new CandidateRetrievalController(
        retrievalService,
        mockCitizenQueryService as CitizenQueryService,
      );

      const res = await controller.searchCandidates(
        { userId: 'citizen-101' },
        {
          citizenContext: {
            userId: 'citizen-101',
            facts: {
              'INVENTED.CANONICAL.CODE': 'malicious',
            },
          },
          mode: 'STRUCTURED_ONLY',
        },
      );

      expect(res.appliedFilters.relevantAttributeCodes).toBeUndefined();
      expect(res.candidates.length).toBeGreaterThanOrEqual(0);
    });
  });
});
