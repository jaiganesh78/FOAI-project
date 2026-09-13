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

describe('CandidateRetrievalService (Sprint 12B)', () => {
  let retrievalService: CandidateRetrievalService;
  let alignmentService: SemanticAlignmentService;
  let registry: SemanticRegistryService;
  let vectorAdapter: DeterministicVectorTestAdapter;
  let mockEmbeddingProvider: IEmbeddingProvider;
  let mockRepository: ICandidateRetrievalRepository;

  const mockPolicies: RawCandidatePolicy[] = [
    {
      policyId: 'doc-pm-kisan',
      policyVersionId: 'ver-pm-kisan-v1',
      policyVersionNumber: 1,
      title: 'PM Kisan Samman Nidhi',
      documentNumber: 'DOC-PM-001',
      classification: 'SCHEME',
      sourceId: 'src-gov-portal',
      state: null, // national
      beneficiaryCategory: 'FARMER',
      department: 'Agriculture',
      referencedAttributes: ['AGRICULTURE.LAND_AREA', 'FINANCIAL.ANNUAL_INCOME'],
      chunkCount: 3,
      sampleChunkTitles: ['Land Ceiling', 'Financial Support'],
    },
    {
      policyId: 'doc-tn-scholarship',
      policyVersionId: 'ver-tn-scholarship-v2',
      policyVersionNumber: 2,
      title: 'Tamil Nadu Higher Education Scholarship',
      documentNumber: 'DOC-TN-002',
      classification: 'SCHEME',
      sourceId: 'src-tn-portal',
      state: 'Tamil Nadu',
      beneficiaryCategory: 'STUDENT',
      department: 'Higher Education',
      referencedAttributes: ['FINANCIAL.ANNUAL_INCOME', 'COMMUNITY.SOCIAL_CATEGORY'],
      chunkCount: 2,
      sampleChunkTitles: ['Income Ceiling', 'Merit Criteria'],
    },
  ];

  beforeEach(() => {
    registry = new SemanticRegistryService();
    alignmentService = new SemanticAlignmentService(registry);
    vectorAdapter = new DeterministicVectorTestAdapter();

    mockEmbeddingProvider = {
      generateEmbedding: vi.fn().mockResolvedValue([1.0, 0.0, 0.0, 0.0]),
      generateEmbeddings: vi.fn().mockResolvedValue([[1.0, 0.0, 0.0, 0.0]]),
    };

    mockRepository = {
      findStructuredCandidates: vi.fn().mockImplementation(async (criteria) => {
        return mockPolicies.filter((p) => {
          if (criteria.state && p.state && p.state.toLowerCase() !== criteria.state.toLowerCase()) {
            return false;
          }
          return true;
        });
      }),
      findCandidatePolicyVersionsByIds: vi.fn().mockImplementation(async (versionIds: string[]) => {
        return mockPolicies.filter((p) => versionIds.includes(p.policyVersionId));
      }),
    };

    retrievalService = new CandidateRetrievalService(
      mockRepository,
      alignmentService,
      vectorAdapter,
      mockEmbeddingProvider,
    );
  });

  describe('Structured Retrieval Mode', () => {
    it('retrieves relevant candidate policy versions based on state and canonical attributes', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            state: 'Tamil Nadu',
            annualIncome: 180000,
            landHolding: 1.2,
          },
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.searchMode).toBe('STRUCTURED_ONLY');

      const pmKisan = result.candidates.find((c) => c.documentNumber === 'DOC-PM-001');
      expect(pmKisan).toBeDefined();
      expect(pmKisan?.policyVersionId).toBe('ver-pm-kisan-v1');
      expect(pmKisan?.retrievalScore).toBeGreaterThan(0.5);
      expect(pmKisan?.retrievalMethod).toBe('STRUCTURED');
      expect(pmKisan?.retrievalEvidence.referencedAttributes).toContain('AGRICULTURE.LAND_AREA');
    });

    it('filters out geographically inapplicable policies', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            state: 'Kerala',
          },
        },
        mode: 'STRUCTURED_ONLY',
      });

      // PM Kisan is national (null state), so it should be included; TN scheme should be filtered out
      const tnScheme = result.candidates.find((c) => c.documentNumber === 'DOC-TN-002');
      expect(tnScheme).toBeUndefined();

      const pmKisan = result.candidates.find((c) => c.documentNumber === 'DOC-PM-001');
      expect(pmKisan).toBeDefined();
    });
  });

  describe('Hybrid Retrieval & Deduplication', () => {
    it('fuses vector similarity and structured signals into single candidate per PolicyVersion', async () => {
      // Register fixture vector with high cosine similarity to query vector [1, 0, 0, 0]
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-pm-1',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v1',
        sectionTitle: 'PM Kisan Chunk 1',
        vector: [1.0, 0.0, 0.0, 0.0], // exact match, cosine similarity = 1.0
      });
      // Register second chunk for the same version
      vectorAdapter.registerFixtureVector({
        chunkId: 'chunk-pm-2',
        documentId: 'doc-pm-kisan',
        versionId: 'ver-pm-kisan-v1',
        sectionTitle: 'PM Kisan Chunk 2',
        vector: [0.8, 0.6, 0.0, 0.0],
      });

      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            state: 'Tamil Nadu',
            annualIncome: 120000,
          },
        },
        mode: 'HYBRID',
      });

      expect(result.status).toBe('SUCCESS');
      const pmKisan = result.candidates.find((c) => c.documentNumber === 'DOC-PM-001');
      expect(pmKisan).toBeDefined();
      expect(pmKisan?.retrievalMethod).toBe('HYBRID');
      expect(pmKisan?.retrievalEvidence.vectorScore).toBeCloseTo(1.0, 2);

      // Verify deduplication: PM Kisan occurs exactly ONCE in candidates list
      const pmKisanCount = result.candidates.filter((c) => c.policyVersionId === 'ver-pm-kisan-v1').length;
      expect(pmKisanCount).toBe(1);
    });

    it('returns PARTIAL_RESULTS with warning when vector search provider is unavailable in HYBRID mode', async () => {
      vectorAdapter.setAvailable(false);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            state: 'Tamil Nadu',
          },
        },
        mode: 'HYBRID',
      });

      expect(result.status).toBe('PARTIAL_RESULTS');
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Vector search provider unavailable'))).toBe(true);
    });
  });

  describe('Failure Semantics & Truthfulness', () => {
    it('returns NO_RESULTS when no policies match', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockResolvedValue([]);

      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: { state: 'NonExistentState' },
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('NO_RESULTS');
      expect(result.candidates).toHaveLength(0);
    });

    it('returns RETRIEVAL_FAILURE when repository encounters an unexpected database error', async () => {
      mockRepository.findStructuredCandidates = vi.fn().mockRejectedValue(new Error('PostgreSQL connection dropped'));

      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: { state: 'Tamil Nadu' },
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.status).toBe('RETRIEVAL_FAILURE');
      expect(result.candidates).toHaveLength(0);
      expect(result.warnings?.[0]).toContain('PostgreSQL connection dropped');
    });
  });

  describe('Deterministic Ordering & Bounding', () => {
    it('sorts candidates descending by retrievalScore and respects maxCandidates limit', async () => {
      const result = await retrievalService.retrieveCandidates({
        citizenContext: {
          facts: {
            state: 'Tamil Nadu',
            annualIncome: 100000,
          },
        },
        constraints: {
          maxCandidates: 1,
        },
        mode: 'STRUCTURED_ONLY',
      });

      expect(result.candidates.length).toBe(1);
      expect(result.returnedCandidates).toBe(1);
      expect(result.totalCandidates).toBe(2);
    });
  });
});
