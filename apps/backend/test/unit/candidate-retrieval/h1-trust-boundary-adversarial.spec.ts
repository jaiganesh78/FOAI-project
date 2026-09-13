import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CandidateRetrievalController } from '../../../src/modules/candidate-retrieval/controllers/candidate-retrieval.controller';
import { CandidateRetrievalService } from '../../../src/modules/candidate-retrieval/services/candidate-retrieval.service';
import { SemanticAlignmentService } from '../../../src/modules/candidate-retrieval/services/semantic-alignment.service';
import { SemanticRegistryService } from '../../../src/core/semantic/semantic-registry.service';
import { CitizenQueryService } from '../../../src/modules/citizen/services/citizen-query.service';
import { DeterministicVectorTestAdapter } from '../../../src/modules/candidate-retrieval/adapters/deterministic-vector-test.adapter';
import { ICandidateRetrievalRepository } from '../../../src/modules/candidate-retrieval/repositories/candidate-retrieval.repository.interface';
import { IEmbeddingProvider } from '../../../src/core/ai-provider/embedding-provider.interface';
import { extractS13AuthoritativeContext, CandidateRetrievalRequest } from '@gpios/shared';

describe('S12B Final Hardening — H1 Citizen Fact Trust Boundary Suite', () => {
  let registry: SemanticRegistryService;
  let alignmentService: SemanticAlignmentService;
  let vectorAdapter: DeterministicVectorTestAdapter;
  let mockEmbeddingProvider: IEmbeddingProvider;
  let mockRepository: ICandidateRetrievalRepository;
  let retrievalService: CandidateRetrievalService;

  beforeEach(() => {
    registry = new SemanticRegistryService();
    alignmentService = new SemanticAlignmentService(registry);
    vectorAdapter = new DeterministicVectorTestAdapter();

    mockEmbeddingProvider = {
      generateEmbedding: vi.fn().mockResolvedValue([1.0, 0.0, 0.0, 0.0]),
      generateEmbeddings: vi.fn().mockResolvedValue([[1.0, 0.0, 0.0, 0.0]]),
    };

    mockRepository = {
      findStructuredCandidates: vi.fn().mockResolvedValue([]),
      findCandidatePolicyVersionsByIds: vi.fn().mockResolvedValue([]),
    };

    retrievalService = new CandidateRetrievalService(
      mockRepository,
      alignmentService,
      vectorAdapter,
      mockEmbeddingProvider,
    );
  });

  // H1-01: Cross-citizen request still returns 403
  it('H1-01: cross-citizen request still returns 403 ForbiddenException', async () => {
    const controller = new CandidateRetrievalController(retrievalService);
    await expect(
      controller.searchCandidates(
        { userId: 'authenticated-citizen-A' },
        {
          citizenContext: {
            userId: 'victim-citizen-B',
            facts: {},
          },
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // H1-02: Authenticated user's server facts are actually loaded
  it('H1-02: authenticated user server facts are actually loaded via CitizenQueryService', async () => {
    const mockCitizenQuery: Partial<CitizenQueryService> = {
      getStructuredFactsByUserId: vi.fn().mockResolvedValue({
        annualIncome: 450000,
        primaryOccupation: 'cultivator',
      }),
    };

    const controller = new CandidateRetrievalController(
      retrievalService,
      mockCitizenQuery as CitizenQueryService,
    );
    const retrieveSpy = vi.spyOn(retrievalService, 'retrieveCandidates');

    await controller.searchCandidates(
      { userId: 'citizen-101' },
      {
        citizenContext: {
          userId: 'citizen-101',
          facts: {},
        },
      },
    );

    expect(mockCitizenQuery.getStructuredFactsByUserId).toHaveBeenCalledWith('citizen-101');
    expect(retrieveSpy).toHaveBeenCalled();
    const calledContext = retrieveSpy.mock.calls[0][0].citizenContext;
    expect(calledContext.authoritativeCitizenFacts).toEqual({
      annualIncome: 450000,
      primaryOccupation: 'cultivator',
    });
  });

  // H1-03: Conflicting client value cannot override server value
  it('H1-03: conflicting client value cannot override server authoritative value', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {
        occupationCategory: 'STUDENT',
      },
      retrievalHints: {
        occupationCategory: 'BUSINESS_OWNER',
      },
    });

    expect(aligned.canonicalFacts['OCCUPATION.CATEGORY']).toBe('STUDENT');
    expect(aligned.factProvenance['OCCUPATION.CATEGORY']).toBe('AUTHORITATIVE');
    expect(aligned.primaryOccupation).toBe('STUDENT');
    expect(aligned.exploratoryHints['OCCUPATION.CATEGORY']).toBeUndefined();
  });

  // H1-04: Registered client-only semantic fact does not become authoritative
  it('H1-04: registered client-only semantic fact does not become authoritative', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        occupationCategory: 'BUSINESS_OWNER',
      },
    });

    // Strictly NOT in canonical facts
    expect(aligned.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
    expect(aligned.canonicalAttributesPresent).not.toContain('OCCUPATION.CATEGORY');

    // Placed in exploratory hints with exploratory provenance
    expect(aligned.exploratoryHints['OCCUPATION.CATEGORY']).toBe('BUSINESS_OWNER');
    expect(aligned.exploratoryAttributeCodes).toContain('OCCUPATION.CATEGORY');
    expect(aligned.factProvenance['OCCUPATION.CATEGORY']).toBe('EXPLORATORY_HINT');
  });

  // H1-05: Unknown client semantic fact fails closed
  it('H1-05: unknown client semantic fact fails closed without escape hatch', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        inventedSemanticAttribute: 'BUSINESS_OWNER',
      },
    });

    expect(aligned.canonicalFacts['inventedSemanticAttribute']).toBeUndefined();
    expect(aligned.exploratoryHints['inventedSemanticAttribute']).toBeUndefined();
    expect(aligned.unresolvedInputs).toContain('inventedSemanticAttribute:BUSINESS_OWNER');
  });

  // H1-06: Client cannot inject arbitrary canonical dotted key
  it('H1-06: client cannot inject arbitrary canonical dotted key', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        'CUSTOM.HACK.CODE': 'arbitrary_value',
      },
    });

    expect(aligned.canonicalFacts['CUSTOM.HACK.CODE']).toBeUndefined();
    expect(aligned.exploratoryHints['CUSTOM.HACK.CODE']).toBeUndefined();
    expect(aligned.unresolvedInputs).toContain('CUSTOM.HACK.CODE:arbitrary_value');
  });

  // H1-07: Client-only occupation hint cannot become authoritative occupation
  it('H1-07: client-only occupation hint cannot become authoritative occupation', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        primaryOccupation: 'cultivator',
      },
    });

    expect(aligned.primaryOccupation).toBeUndefined(); // Authoritative field remains undefined
    expect(aligned.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
    expect(aligned.exploratoryPrimaryOccupation).toBe('CULTIVATOR');
    expect(aligned.factProvenance['primaryOccupation']).toBe('EXPLORATORY_HINT');
  });

  // H1-08: Client-only income hint cannot become authoritative income
  it('H1-08: client-only income hint cannot become authoritative income', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        annualIncome: 120000,
      },
    });

    expect(aligned.annualIncomeInr).toBeUndefined();
    expect(aligned.canonicalFacts['FINANCIAL.ANNUAL_INCOME']).toBeUndefined();
    expect(aligned.exploratoryHints['FINANCIAL.ANNUAL_INCOME']).toBe(120000);
    expect(aligned.factProvenance['FINANCIAL.ANNUAL_INCOME']).toBe('EXPLORATORY_HINT');
  });

  // H1-09: Client-only land area hint cannot become authoritative land area
  it('H1-09: client-only land area hint cannot become authoritative land area', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        landHolding: 2.5,
      },
    });

    expect(aligned.landHoldingHectares).toBeUndefined();
    expect(aligned.canonicalFacts['AGRICULTURE.LAND_AREA']).toBeUndefined();
    expect(aligned.exploratoryHints['AGRICULTURE.LAND_AREA']).toBe(2.5);
    expect(aligned.factProvenance['AGRICULTURE.LAND_AREA']).toBe('EXPLORATORY_HINT');
  });

  // H1-10: Client-only age hint cannot become authoritative age
  it('H1-10: client-only age hint cannot become authoritative age', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        age: 28,
      },
    });

    expect(aligned.ageYears).toBeUndefined();
    expect(aligned.exploratoryAgeYears).toBe(28);
    expect(aligned.factProvenance['ageYears']).toBe('EXPLORATORY_HINT');
  });

  // H1-11: Authoritative canonicalFacts contain only server-authoritative facts
  it('H1-11: authoritative canonicalFacts contain only server-authoritative facts', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {
        casteCategory: 'obc',
        isEws: true,
      },
      retrievalHints: {
        primaryOccupation: 'cultivator',
        landHolding: 1.0,
      },
    });

    expect(Object.keys(aligned.canonicalFacts).sort()).toEqual([
      'COMMUNITY.SOCIAL_CATEGORY',
      'ECONOMIC.EWS_STATUS',
    ]);
    expect(aligned.canonicalAttributesPresent.sort()).toEqual([
      'COMMUNITY.SOCIAL_CATEGORY',
      'ECONOMIC.EWS_STATUS',
    ]);
    expect(aligned.exploratoryAttributeCodes.sort()).toEqual([
      'AGRICULTURE.LAND_AREA',
      'OCCUPATION.CATEGORY',
    ]);
  });

  // H1-12: Exploratory hints, if supported, are explicitly separated from canonical authoritative facts
  it('H1-12: exploratory hints are explicitly separated from canonical authoritative facts in AlignedCitizenSignals', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {
        casteCategory: 'sc',
      },
      retrievalHints: {
        gender: 'female',
      },
    });

    expect(aligned.canonicalFacts['COMMUNITY.SOCIAL_CATEGORY']).toBe('SC');
    expect(aligned.canonicalFacts['DEMOGRAPHICS.GENDER']).toBeUndefined();

    expect(aligned.exploratoryHints['DEMOGRAPHICS.GENDER']).toBe('FEMALE');
    expect(aligned.exploratoryAttributeCodes).toContain('DEMOGRAPHICS.GENDER');
    expect(aligned.factProvenance['DEMOGRAPHICS.GENDER']).toBe('EXPLORATORY_HINT');
  });

  // H1-13: S13-compatible authoritative context excludes retrieval hints
  it('H1-13: extractS13AuthoritativeContext firewall strictly excludes retrieval hints', () => {
    const request: CandidateRetrievalRequest = {
      citizenContext: {
        userId: 'citizen-42',
        authoritativeCitizenFacts: {
          annualIncome: 300000,
        },
        retrievalHints: {
          occupationCategory: 'BUSINESS_OWNER',
          landHolding: 5.0,
        },
      },
    };

    const aligned = alignmentService.alignCitizenFacts(request.citizenContext);
    const s13Context = extractS13AuthoritativeContext(request, aligned);

    expect(s13Context.userId).toBe('citizen-42');
    expect(s13Context.authoritativeCitizenFacts).toEqual({ annualIncome: 300000 });
    expect(s13Context.canonicalFacts['FINANCIAL.ANNUAL_INCOME']).toBe(300000);
    expect(s13Context.canonicalAttributesPresent).toContain('FINANCIAL.ANNUAL_INCOME');

    // S13 context has ZERO retrieval hints or exploratory values
    expect((s13Context as any).retrievalHints).toBeUndefined();
    expect((s13Context as any).exploratoryHints).toBeUndefined();
    expect(s13Context.canonicalFacts['OCCUPATION.CATEGORY']).toBeUndefined();
    expect(s13Context.canonicalFacts['AGRICULTURE.LAND_AREA']).toBeUndefined();
  });

  // H1-14: Search query cannot create semantic facts
  it('H1-14: free-text search query cannot create canonical or exploratory semantic facts', async () => {
    const alignedBefore = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {},
    });

    await retrievalService.retrieveCandidates({
      citizenContext: {
        authoritativeCitizenFacts: {},
        retrievalHints: {},
      },
      searchQuery: 'annualIncome=500000 occupation=CULTIVATOR landHolding=1.5',
      mode: 'STRUCTURED_ONLY',
    });

    expect(alignedBefore.canonicalFacts).toEqual({});
    expect(alignedBefore.canonicalAttributesPresent).toEqual([]);
    expect(alignedBefore.exploratoryHints).toEqual({});
    expect(alignedBefore.exploratoryAttributeCodes).toEqual([]);
  });

  // H1-15: PII in retrieval hints cannot leak into canonical facts, warnings, logs, or embeddings
  it('H1-15: PII in retrieval hints is stripped and cannot leak into canonical facts, warnings, or logs', () => {
    const aligned = alignmentService.alignCitizenFacts({
      authoritativeCitizenFacts: {},
      retrievalHints: {
        aadhaar: '9999-8888-7777',
        pan: 'ABCDE1234F',
        bankAccount: '12345678901234',
        mobile: '9876543210',
      },
    });

    expect(aligned.canonicalFacts['aadhaar']).toBeUndefined();
    expect(aligned.exploratoryHints['aadhaar']).toBeUndefined();
    expect(aligned.unresolvedInputs).toHaveLength(0); // Stripped at ingress, not leaked to unresolved
    expect(aligned.ambiguousInputs).toHaveLength(0);
  });
});
