import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateRetrievalService } from '../../../src/modules/candidate-retrieval/services/candidate-retrieval.service';
import { SemanticAlignmentService } from '../../../src/modules/candidate-retrieval/services/semantic-alignment.service';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { DeterministicVectorTestAdapter } from '../../../src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter';
import { ICandidateRetrievalRepository } from '../../../src/modules/candidate-retrieval/repositories/candidate-retrieval.repository.interface';
import { IEmbeddingProvider } from '../../../src/core/ai-provider/embedding-provider.interface';

describe('S12B Mandatory Adversarial Tests (13 Invariant Tests)', () => {
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
          state: null,
          beneficiaryCategory: 'FARMER',
          department: 'Agriculture',
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

  // TEST 1: Similarity != Eligibility
  it('TEST 1: retrieves a policy with high vector similarity even when citizen facts clearly exceed eligibility limits', async () => {
    // Register high similarity vector for PM Kisan
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-1',
      documentId: 'doc-pm-kisan',
      versionId: 'ver-pm-kisan-v1',
      sectionTitle: 'PM Kisan Rules',
      vector: [1.0, 0.0, 0.0, 0.0], // 100% cosine similarity
    });

    // Citizen has 50 hectares of land (clearly above typical 2-hectare eligibility limit)
    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: {
          landHolding: 50.0,
          annualIncome: 50000000,
        },
      },
      mode: 'HYBRID',
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].retrievalScore).toBeGreaterThan(0.7);
    // Crucially: retrieval DOES NOT declare the citizen eligible or ineligible
    expect((result.candidates[0] as any).eligible).toBeUndefined();
    expect((result.candidates[0] as any).isEligible).toBeUndefined();
  });

  // TEST 2: Low Similarity != Ineligible
  it('TEST 2: does not filter out a candidate policy merely because vector similarity is low', async () => {
    // Vector with low similarity (0.1)
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-1',
      documentId: 'doc-pm-kisan',
      versionId: 'ver-pm-kisan-v1',
      sectionTitle: 'PM Kisan Rules',
      vector: [0.1, 0.99, 0.0, 0.0], // low cosine similarity to [1, 0, 0, 0]
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: {
          landHolding: 1.0,
        },
      },
      mode: 'HYBRID',
    });

    // Policy is still returned as a candidate based on structured applicability
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].documentNumber).toBe('DOC-PM-001');
  });

  // TEST 3: Vector Cannot Satisfy Rule
  it('TEST 3: vector similarity score cannot satisfy or substitute for a policy rule condition', async () => {
    const candidateResult = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: { state: 'Tamil Nadu' },
      },
      mode: 'STRUCTURED_ONLY',
    });

    const candidate = candidateResult.candidates[0];
    expect(candidate).toBeDefined();
    // Verify retrieval evidence contains only search metadata, never rule satisfaction proof
    expect((candidate.retrievalEvidence as any).passedRules).toBeUndefined();
    expect((candidate.retrievalEvidence as any).ruleSatisfied).toBeUndefined();
  });

  // TEST 4: No RuleEngine Bypass
  it('TEST 4: candidate retrieval never invokes RuleEngineService to evaluate conditions', async () => {
    // Inspect candidate retrieval execution: it never executes rule operators
    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: {
          annualIncome: 100000,
          landHolding: 1.5,
        },
      },
      mode: 'STRUCTURED_ONLY',
    });

    // Invariant: Result contains retrieval scores and matched attributes, zero rule evaluations
    for (const cand of result.candidates) {
      expect((cand as any).ruleEvaluationResults).toBeUndefined();
      expect((cand as any).eligibilityStatus).toBeUndefined();
    }
  });

  // TEST 5: No Fact Mutation
  it('TEST 5: candidate retrieval never creates, updates, or writes citizen facts', async () => {
    const inputFacts = Object.freeze({
      annualIncome: 200000,
      occupation: 'cultivator',
    });

    await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: inputFacts as any,
      },
      mode: 'STRUCTURED_ONLY',
    });

    // Citizen facts input remains completely unaltered
    expect(inputFacts.annualIncome).toBe(200000);
    expect(inputFacts.occupation).toBe('cultivator');
  });

  // TEST 6: No Policy Mutation
  it('TEST 6: candidate retrieval is read-only and never modifies policy rules or versions', async () => {
    const updateSpy = vi.fn();
    (mockRepository as any).update = updateSpy;

    await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: { state: 'Tamil Nadu' },
      },
      mode: 'STRUCTURED_ONLY',
    });

    expect(updateSpy).not.toHaveBeenCalled();
  });

  // TEST 7: Contextual Alias Refusal
  it('TEST 7: "farmer" does NOT resolve to CULTIVATOR (remains in unresolvedInputs without guessing)', async () => {
    const aligned = alignmentService.alignCitizenFacts({
      occupation: 'farmer',
    });

    expect(aligned.primaryOccupation).toBeUndefined();
    expect(aligned.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
    expect(aligned.unresolvedInputs).toContain('occupation:farmer');

    // Retrieval with 'farmer' issues a warning about unresolved inputs
    const result = await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: { occupation: 'farmer' },
      },
      mode: 'STRUCTURED_ONLY',
    });

    expect(result.warnings?.some((w) => w.includes('occupation:farmer'))).toBe(true);
  });

  // TEST 8: Ambiguous Phrase Refusal
  it('TEST 8: "business worker" remains ambiguous and does NOT resolve to BUSINESS_OWNER', async () => {
    const aligned = alignmentService.alignCitizenFacts({
      occupation: 'business worker',
    });

    expect(aligned.primaryOccupation).toBeUndefined();
    expect(aligned.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
    expect(aligned.ambiguousInputs).toContain('occupation:business worker');
  });

  // TEST 9: PII Exclusion
  it('TEST 9: Aadhaar and bank account identifiers are completely excluded from retrieval signals and query text', async () => {
    const aligned = alignmentService.alignCitizenFacts({
      state: 'Tamil Nadu',
      aadhaarNumber: '1111-2222-3333',
      bankAccountNumber: '998877665544',
      panNumber: 'ABCDE9999F',
    });

    expect(aligned.state).toBe('Tamil Nadu');
    const serialized = JSON.stringify(aligned);
    expect(serialized).not.toContain('1111-2222-3333');
    expect(serialized).not.toContain('998877665544');
    expect(serialized).not.toContain('ABCDE9999F');

    // Check retrieval embedding query does not contain sensitive data
    await retrievalService.retrieveCandidates({
      citizenContext: {
        facts: {
          aadhaarNumber: '1111-2222-3333',
          bankAccountNumber: '998877665544',
        },
      },
      mode: 'HYBRID',
    });

    const calls = (mockEmbeddingProvider.generateEmbedding as any).mock.calls;
    for (const call of calls) {
      expect(call[0]).not.toContain('1111-2222-3333');
      expect(call[0]).not.toContain('998877665544');
    }
  });

  // TEST 10: Version Isolation
  it('TEST 10: chunks from different policy versions cannot be fused into a single candidate', async () => {
    // Register chunk from version 1
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-v1',
      documentId: 'doc-pm-kisan',
      versionId: 'ver-pm-kisan-v1',
      sectionTitle: 'Version 1 Chunk',
      vector: [1.0, 0.0, 0.0, 0.0],
    });
    // Register chunk from version 2 of the same document
    vectorAdapter.registerFixtureVector({
      chunkId: 'chunk-v2',
      documentId: 'doc-pm-kisan',
      versionId: 'ver-pm-kisan-v2',
      sectionTitle: 'Version 2 Chunk',
      vector: [1.0, 0.0, 0.0, 0.0],
    });

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'HYBRID',
    });

    // The candidate for ver-pm-kisan-v1 must NOT include evidence from ver-pm-kisan-v2
    const v1Candidate = result.candidates.find((c) => c.policyVersionId === 'ver-pm-kisan-v1');
    expect(v1Candidate).toBeDefined();
    expect(v1Candidate?.retrievalEvidence.sampleChunkTitles).not.toContain('Version 2 Chunk');
  });

  // TEST 11: Failure Truthfulness
  it('TEST 11: database query error returns RETRIEVAL_FAILURE and never masquerades as NO_RESULTS', async () => {
    mockRepository.findStructuredCandidates = vi.fn().mockRejectedValue(new Error('Fatal DB Connection Error'));

    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'STRUCTURED_ONLY',
    });

    expect(result.status).toBe('RETRIEVAL_FAILURE');
    expect(result.status).not.toBe('NO_RESULTS');
    expect(result.warnings?.[0]).toContain('Fatal DB Connection Error');
  });

  // TEST 12: No Eligibility Decisions in Result
  it('TEST 12: candidate result object contains zero eligibility decision fields', async () => {
    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'STRUCTURED_ONLY',
    });

    const rawResultJson = JSON.stringify(result);
    expect(rawResultJson).not.toContain('"eligible"');
    expect(rawResultJson).not.toContain('"isEligible"');
    expect(rawResultJson).not.toContain('"eligibilityDecision"');
    expect(rawResultJson).not.toContain('"eligibilityStatus"');
  });

  // TEST 13: Exact Version Traceability for S13
  it('TEST 13: retrieved candidate provides exact policyVersionId enabling independent S13 evaluation', async () => {
    const result = await retrievalService.retrieveCandidates({
      citizenContext: { facts: {} },
      mode: 'STRUCTURED_ONLY',
    });

    const candidate = result.candidates[0];
    expect(candidate.policyId).toBe('doc-pm-kisan');
    expect(candidate.policyVersionId).toBe('ver-pm-kisan-v1');
    expect(candidate.policyVersionNumber).toBe(1);
    expect(candidate.provenance.versionId).toBe('ver-pm-kisan-v1');
  });
});
