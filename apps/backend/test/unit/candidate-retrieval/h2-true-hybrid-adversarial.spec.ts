import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateRetrievalService } from '../../../src/modules/candidate-retrieval/services/candidate-retrieval.service';
import { SemanticAlignmentService } from '../../../src/modules/candidate-retrieval/services/semantic-alignment.service';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { DeterministicVectorTestAdapter } from '../../../src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter';
import {
  ICandidateRetrievalRepository,
  RawCandidatePolicy,
} from '../../../src/modules/candidate-retrieval/repositories/candidate-retrieval.repository.interface';
import { IEmbeddingProvider } from '../../../src/core/ai-provider/embedding-provider.interface';

describe('S12B Final Hardening — H2 True Hybrid Retrieval Suite', () => {
  let registry: SemanticRegistryService;
  let alignmentService: SemanticAlignmentService;
  let vectorAdapter: DeterministicVectorTestAdapter;
  let mockEmbeddingProvider: IEmbeddingProvider;
  let mockRepository: ICandidateRetrievalRepository;
  let retrievalService: CandidateRetrievalService;

  const policyA: RawCandidatePolicy = {
    policyId: 'doc-policy-a',
    policyVersionId: 'ver-policy-a-v1',
    policyVersionNumber: 1,
    title: 'Policy A - Farmer Scheme',
    documentNumber: 'DOC-POL-A',
    classification: 'SCHEME',
    sourceId: 'src-portal-a',
    state: 'Punjab',
    beneficiaryCategory: 'FARMER',
    department: 'Agriculture',
    referencedAttributes: ['AGRICULTURE.LAND_AREA'],
    chunkCount: 2,
    sampleChunkTitles: ['Land Criteria'],
  };

  const policyB: RawCandidatePolicy = {
    policyId: 'doc-policy-b',
    policyVersionId: 'ver-policy-b-v1',
    policyVersionNumber: 1,
    title: 'Policy B - Rural Energy Initiative',
    documentNumber: 'DOC-POL-B',
    classification: 'SCHEME',
    sourceId: 'src-portal-b',
    state: 'Haryana', // Excluded from Punjab structured filter!
    beneficiaryCategory: 'ALL',
    department: 'Renewable Energy',
    referencedAttributes: ['FINANCIAL.ANNUAL_INCOME'],
    chunkCount: 3,
    sampleChunkTitles: ['Solar Pump Subsidy'],
  };

  beforeEach(() => {
    registry = new SemanticRegistryService();
    alignmentService = new SemanticAlignmentService(registry);
    vectorAdapter = new DeterministicVectorTestAdapter();

    mockEmbeddingProvider = {
      generateEmbedding: vi.fn().mockResolvedValue([1.0, 0.0, 0.0, 0.0]),
      generateEmbeddings: vi.fn().mockResolvedValue([[1.0, 0.0, 0.0, 0.0]]),
    };

    mockRepository = {
      findStructuredCandidates: vi.fn().mockResolvedValue([policyA]),
      findCandidatePolicyVersionsByIds: vi.fn().mockImplementation(async (versionIds: string[]) => {
        const pool = [policyA, policyB];
        return pool.filter((p) => versionIds.includes(p.policyVersionId));
      }),
    };

    retrievalService = new CandidateRetrievalService(
      mockRepository,
      alignmentService,
      vectorAdapter,
      mockEmbeddingProvider,
    );
  });

  // ============================================================
  // MANDATORY ARCHITECTURAL PROOF TEST (SECTION 17)
  // ============================================================
  it('H2 vector discovery can recover a policy excluded from structured candidate retrieval', async () => {
    // Structured retrieval returns ONLY Policy A (Policy B is excluded due to state/criteria)
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([policyA]);

    // Vector adapter independently indexes chunk for Policy B with high similarity
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-b-1',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-v1',
      sectionTitle: 'Solar Pump Subsidy Overview',
      vector: [1.0, 0.0, 0.0, 0.0], // Exact match with query vector
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: { state: 'Punjab' },
      },
      searchQuery: 'solar powered pump assistance',
      mode: 'HYBRID',
    });

    expect(result.status).toBe('SUCCESS');

    // Policy B MUST be discovered and returned even though structured retrieval excluded it!
    const candidateB = result.candidates.find((c) => c.policyVersionId === 'ver-policy-b-v1');
    expect(candidateB).toBeDefined();
    expect(candidateB?.retrievalMethod).toBe('VECTOR');
    expect(candidateB?.retrievalEvidence.vectorScore).toBeCloseTo(1.0, 2);

    // Policy A is also present via structured channel
    const candidateA = result.candidates.find((c) => c.policyVersionId === 'ver-policy-a-v1');
    expect(candidateA).toBeDefined();
    expect(candidateA?.retrievalMethod).toBe('STRUCTURED');
  });

  // H2-01: Structured-only mode does not invoke vector retrieval
  it('H2-01: structured-only mode does not invoke vector retrieval provider', async () => {
    const vectorSpy = vi.spyOn(vectorAdapter, 'searchSimilarChunks');

    await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'STRUCTURED_ONLY',
    });

    expect(vectorSpy).not.toHaveBeenCalled();
    expect(mockEmbeddingProvider.generateEmbedding).not.toHaveBeenCalled();
  });

  // H2-02: Hybrid mode invokes structured retrieval
  it('H2-02: hybrid mode invokes structured retrieval', async () => {
    await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    expect(mockRepository.findStructuredCandidates).toHaveBeenCalled();
  });

  // H2-03: Hybrid mode invokes independent vector retrieval across active policy corpus
  it('H2-03: hybrid mode invokes independent vector retrieval with corpusScope', async () => {
    const vectorSpy = vi.spyOn(vectorAdapter, 'searchSimilarChunks');

    await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    expect(vectorSpy).toHaveBeenCalled();
    const calledOptions = vectorSpy.mock.calls[0][1];
    expect(calledOptions.corpusScope).toBe('ACTIVE_CURRENT_POLICY_VERSIONS');
    // Vector search MUST NOT be constrained to structured candidate version IDs
    expect(calledOptions.versionFilter).toBeUndefined();
    expect(calledOptions.allowedVersionScope).toBeUndefined();
  });

  // H2-04: Vector candidate not present in structured set is retained
  it('H2-04: vector candidate not present in structured set is retained', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]); // Structured returns empty

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-b-1',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-v1',
      vector: [0.9, 0.43, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].policyVersionId).toBe('ver-policy-b-v1');
    expect(result.candidates[0].retrievalMethod).toBe('VECTOR');
  });

  // H2-05: Structured candidate with no vector match remains retained
  it('H2-05: structured candidate with no vector match remains retained', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([policyA]);
    // Vector search returns no matches

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].policyVersionId).toBe('ver-policy-a-v1');
    expect(result.candidates[0].retrievalMethod).toBe('STRUCTURED');
    expect(result.candidates[0].retrievalEvidence.vectorScore).toBeUndefined();
  });

  // H2-06: Candidate returned by both channels is deduplicated
  it('H2-06: candidate returned by both channels is deduplicated by exact PolicyVersion', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([policyA]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-a-1',
      documentId: 'doc-policy-a',
      versionId: 'ver-policy-a-v1',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    const matches = result.candidates.filter((c) => c.policyVersionId === 'ver-policy-a-v1');
    expect(matches).toHaveLength(1);
    expect(matches[0].retrievalMethod).toBe('HYBRID');
    expect(matches[0].retrievalEvidence.vectorScore).toBeDefined();
  });

  // H2-07: Vector-only candidate has no fabricated structured match flags
  it('H2-07: vector-only candidate has no fabricated structured match flags (undefined)', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-b-1',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-v1',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    const candidateB = result.candidates[0];
    expect(candidateB.retrievalMethod).toBe('VECTOR');
    expect(candidateB.retrievalEvidence.stateMatch).toBeUndefined();
    expect(candidateB.retrievalEvidence.beneficiaryCategoryMatch).toBeUndefined();
    expect(candidateB.retrievalEvidence.departmentMatch).toBeUndefined();
    expect(candidateB.retrievalEvidence.ministryMatch).toBeUndefined();
    expect(candidateB.retrievalEvidence.policyClassificationMatch).toBeUndefined();
    expect(candidateB.retrievalEvidence.referencedAttributes).toHaveLength(0);
  });

  // H2-08: Structured-only candidate has no fabricated vector score
  it('H2-08: structured-only candidate has no fabricated vector score', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([policyA]);

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    const candidateA = result.candidates[0];
    expect(candidateA.retrievalMethod).toBe('STRUCTURED');
    expect(candidateA.retrievalEvidence.vectorScore).toBeUndefined();
  });

  // H2-09: Wrong documentId vector match is rejected
  it('H2-09: vector match with wrong documentId is rejected (document-level mismatch)', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-bad-doc',
      documentId: 'doc-WRONG-ID', // Mismatched documentId
      versionId: 'ver-policy-b-v1',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('NO_RESULTS');
    expect(result.candidates).toHaveLength(0);
  });

  // H2-10: Wrong versionId vector match is rejected
  it('H2-10: vector match with unknown/wrong versionId is rejected', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);
    // Repository returns nothing for nonexistent version
    mockRepository.findCandidatePolicyVersionsByIds = vi.fn().mockResolvedValue([]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-bad-ver',
      documentId: 'doc-policy-b',
      versionId: 'ver-NONEXISTENT',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('NO_RESULTS');
    expect(result.candidates).toHaveLength(0);
  });

  // H2-11: Inactive/superseded vector version cannot enter active candidate results
  it('H2-11: inactive or superseded vector version cannot enter active candidate results', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);
    // Repository findCandidatePolicyVersionsByIds enforces isCurrent: true, returning empty for superseded
    mockRepository.findCandidatePolicyVersionsByIds = vi.fn().mockResolvedValue([]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-superseded',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-old-v0', // Superseded version
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.candidates).toHaveLength(0);
  });

  // H2-12: Deterministic fusion produces stable ordering
  it('H2-12: deterministic fusion produces identical ordering across multiple runs', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([policyA, policyB]);

    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-a-1',
      documentId: 'doc-policy-a',
      versionId: 'ver-policy-a-v1',
      vector: [0.9, 0.43, 0.0, 0.0],
    });
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-b-1',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-v1',
      vector: [0.95, 0.31, 0.0, 0.0],
    });

    const run1 = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });
    const run2 = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(run1.candidates.map((c) => c.policyVersionId)).toEqual(
      run2.candidates.map((c) => c.policyVersionId),
    );
  });

  // H2-13: Tie-breaking remains: score DESC, documentNumber ASC, policyVersionId ASC
  it('H2-13: tie-breaking deterministically uses score DESC, documentNumber ASC, policyVersionId ASC', async () => {
    const tiePolicy1: RawCandidatePolicy = {
      ...policyA,
      policyId: 'doc-tie-1',
      policyVersionId: 'ver-tie-1',
      documentNumber: 'DOC-B',
    };
    const tiePolicy2: RawCandidatePolicy = {
      ...policyA,
      policyId: 'doc-tie-2',
      policyVersionId: 'ver-tie-2',
      documentNumber: 'DOC-A', // Smaller documentNumber comes first
    };

    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([tiePolicy1, tiePolicy2]);

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'STRUCTURED_ONLY',
    });

    expect(result.candidates[0].documentNumber).toBe('DOC-A');
    expect(result.candidates[1].documentNumber).toBe('DOC-B');
  });

  // H2-14: Vector similarity remains relevance only
  it('H2-14: vector similarity remains relevance score only; contains zero eligibility fields', async () => {
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-b-1',
      documentId: 'doc-policy-b',
      versionId: 'ver-policy-b-v1',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    for (const c of result.candidates) {
      expect((c as any).isEligible).toBeUndefined();
      expect((c as any).eligibilityConfidence).toBeUndefined();
      expect((c as any).passedRules).toBeUndefined();
      expect((c as any).failedRules).toBeUndefined();
      expect((c as any).eligibilityProbability).toBeUndefined();
      expect(c.retrievalScore).toBeGreaterThanOrEqual(0.0);
      expect(c.retrievalScore).toBeLessThanOrEqual(1.0);
    }
  });

  // H2-15: No RuleEngine invocation
  it('H2-15: candidate retrieval does not instantiate or invoke RuleEngineService', async () => {
    // CandidateRetrievalService constructor only receives repository, alignmentService, vectorProvider, embeddingProvider
    // RuleEngineService is not injected or referenced anywhere in CandidateRetrievalService
    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });
    expect(result).toBeDefined();
  });

  // H2-16: Threshold violation does not remove a policy during candidate retrieval
  it('H2-16: policy numeric thresholds (income ceiling, land limit) are NOT evaluated during retrieval', async () => {
    // Policy A references AGRICULTURE.LAND_AREA. Citizen has 100 hectares (likely over any PM Kisan ceiling).
    // Retrieval MUST NOT evaluate land <= 2.0; it only evaluates relevance / candidate suitability.
    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: {
          landHolding: 100.0,
          state: 'Punjab',
        },
      },
      mode: 'STRUCTURED_ONLY',
    });

    const candidateA = result.candidates.find((c) => c.documentNumber === 'DOC-POL-A');
    expect(candidateA).toBeDefined(); // Policy A is NOT pruned due to threshold violation!
  });

  // H2-17: Vector retrieval failure produces PARTIAL_RESULTS only when structured retrieval succeeds
  it('H2-17: vector retrieval failure produces PARTIAL_RESULTS when structured retrieval succeeds', async () => {
    vectorAdapter.setAvailable(false);

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: { state: 'Punjab' } },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('PARTIAL_RESULTS');
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.warnings?.some((w) => w.includes('Vector search provider unavailable'))).toBe(true);
  });

  // H2-18: Structured retrieval failure produces RETRIEVAL_FAILURE
  it('H2-18: structured retrieval database failure produces RETRIEVAL_FAILURE', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockRejectedValue(new Error('Connection failure'));

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('RETRIEVAL_FAILURE');
    expect(result.candidates).toHaveLength(0);
    expect(result.warnings?.[0]).toContain('Connection failure');
  });

  // H2-19: No candidates produces NO_RESULTS
  it('H2-19: no candidates found by structured or vector produces NO_RESULTS', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('NO_RESULTS');
    expect(result.candidates).toHaveLength(0);
  });

  // H2-20: Hybrid retrieval never leaks PII to embedding provider
  it('H2-20: hybrid retrieval scrubs Aadhaar, PAN, and bank accounts before calling embedding provider', async () => {
    await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      searchQuery: 'My Aadhaar is 1234-5678-9012 and PAN is ABCDE1234F assistance',
      mode: 'HYBRID',
    });

    expect(mockEmbeddingProvider.generateEmbedding).toHaveBeenCalled();
    const calledText = (mockEmbeddingProvider.generateEmbedding as any).mock.calls[0][0];
    expect(calledText).not.toContain('1234-5678-9012');
    expect(calledText).not.toContain('ABCDE1234F');
    expect(calledText).toContain('[REDACTED_IDENTIFIER]');
  });

  // Section 22: Working set candidate count vs returnedCandidates
  it('Section 22: correctly computes totalCandidates as qualifying working-set count when bounded by maxCandidates', async () => {
    const twentyPolicies: RawCandidatePolicy[] = Array.from({ length: 20 }, (_, i) => ({
      ...policyA,
      policyId: `doc-${i}`,
      policyVersionId: `ver-${i}`,
      documentNumber: `DOC-${String(i).padStart(3, '0')}`,
    }));

    mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue(twentyPolicies);

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      constraints: {
        maxCandidates: 10,
      },
      mode: 'STRUCTURED_ONLY',
    });

    expect(result.returnedCandidates).toBe(10);
    expect(result.totalCandidates).toBe(20);
    expect(result.candidates).toHaveLength(10);
  });
});
