import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CANDIDATE_RETRIEVAL_REPOSITORY,
  SEMANTIC_ALIGNMENT_SERVICE,
  VECTOR_SEARCH_PROVIDER,
  EMBEDDING_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { ICandidateRetrievalRepository, RawCandidatePolicy } from '../repositories/candidate-retrieval.repository.interface';
import { SemanticAlignmentService } from './semantic-alignment.service';
import { IVectorSearchProvider, RawVectorMatch } from '../adapters/vector-search.adapter.interface';
import { IEmbeddingProvider } from '../../../core/ai-provider/embedding-provider.interface';
import {
  CandidateRetrievalRequest,
  CandidateRetrievalResult,
  CandidatePolicy,
  RetrievalMode,
  RetrievalStatus,
} from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class CandidateRetrievalService {
  private readonly logger = new Logger(CandidateRetrievalService.name);

  constructor(
    @Inject(CANDIDATE_RETRIEVAL_REPOSITORY)
    private readonly repository: ICandidateRetrievalRepository,
    @Inject(SEMANTIC_ALIGNMENT_SERVICE)
    private readonly alignmentService: SemanticAlignmentService,
    @Inject(VECTOR_SEARCH_PROVIDER)
    private readonly vectorProvider: IVectorSearchProvider,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: IEmbeddingProvider,
  ) {}

  /**
   * Retrieves a bounded set of candidate policy versions based on citizen context.
   *
   * STRICT ARCHITECTURAL INVARIANTS:
   * 1. Retrieval answers: "Which policies are worth evaluating?" — NEVER "Is the citizen eligible?".
   * 2. Candidate retrieval never calls RuleEngineService or evaluates numeric thresholds.
   * 3. Candidate results never contain eligibility decisions (eligible/isEligible flags are omitted).
   * 4. retrievalScore is a deterministic candidate-ranking/relevance score (0.0 to 1.0).
   *    It is NOT:
   *    - eligibility probability
   *    - eligibility confidence
   *    - semantic certainty
   *    - policy validity
   *    - probability of approval
   *    The score must never be consumed by S13 as an eligibility signal.
   * 5. Policy version safety: every candidate is bound to an exact PolicyVersion.
   * 6. Chunks from different versions can never be fused.
   */
  async retrieveCandidates(request: CandidateRetrievalRequest): Promise<CandidateRetrievalResult> {
    const startTime = Date.now();
    const traceId = randomUUID();
    const mode: RetrievalMode = request.mode || 'STRUCTURED_ONLY';
    const warnings: string[] = [];

    this.logger.log(`Starting Candidate Retrieval [Trace: ${traceId}, Mode: ${mode}]`);

    // 1. Semantic Alignment (extract safe signals, purge sensitive PII, separate hints)
    const alignedSignals = this.alignmentService.alignCitizenFacts(
      request.citizenContext as unknown as Record<string, unknown>,
    );

    if (alignedSignals.unresolvedInputs.length > 0) {
      warnings.push(`Unresolved context-required inputs preserved without inference: ${alignedSignals.unresolvedInputs.join(', ')}`);
    }
    if (alignedSignals.ambiguousInputs.length > 0) {
      warnings.push(`Ambiguous inputs preserved without inference: ${alignedSignals.ambiguousInputs.join(', ')}`);
    }

    // 2. Formulate Structured Filter Criteria
    const maxCandidates = Math.min(Math.max(request.constraints?.maxCandidates || 10, 1), 50);
    const filterState = request.constraints?.state || alignedSignals.state || alignedSignals.exploratoryState;
    const filterBeneficiaryCat =
      request.constraints?.beneficiaryCategory ||
      alignedSignals.beneficiaryCategory ||
      alignedSignals.exploratoryBeneficiaryCategory;
    const filterClassification = request.constraints?.policyClassification;
    const filterDept = request.constraints?.department;
    const filterMinistry = request.constraints?.ministry;

    const relevantAttributeCodes = [
      ...alignedSignals.canonicalAttributesPresent,
      ...alignedSignals.exploratoryAttributeCodes,
    ];

    let rawPolicies: RawCandidatePolicy[] = [];
    try {
      rawPolicies = await this.repository.findStructuredCandidates({
        state: filterState,
        policyClassification: filterClassification,
        beneficiaryCategory: filterBeneficiaryCat,
        department: filterDept,
        ministry: filterMinistry,
        relevantAttributeCodes: relevantAttributeCodes.length > 0 ? relevantAttributeCodes : undefined,
        limit: maxCandidates * 2,
      });
    } catch (err: any) {
      this.logger.error(`Database failure in structured candidate retrieval: ${err.message}`, err.stack);
      return {
        status: 'RETRIEVAL_FAILURE',
        candidates: [],
        returnedCandidates: 0,
        totalCandidates: 0,
        searchDurationMs: Date.now() - startTime,
        searchMode: mode,
        appliedFilters: { state: filterState, classification: filterClassification },
        warnings: [`Database retrieval failed: ${err.message}`],
        executionTraceId: traceId,
      };
    }

    // 3. Independent Vector Retrieval (H2: True Hybrid Discovery)
    let vectorMatches: RawVectorMatch[] = [];
    let vectorSearchAvailable = false;

    if (mode === 'HYBRID') {
      vectorSearchAvailable = this.vectorProvider.isAvailable();

      if (!vectorSearchAvailable) {
        warnings.push('Vector search provider unavailable; returning structured candidates only');
      } else {
        try {
          // PII-Safe Query Construction (Finding R3)
          // Search query CANNOT create canonical semantic facts (H1-14).
          const effectiveOccupation = alignedSignals.primaryOccupation || alignedSignals.exploratoryPrimaryOccupation;
          let safeQueryText = [effectiveOccupation, filterState, filterBeneficiaryCat].filter(Boolean).join(' ');
          if (request.searchQuery && request.searchQuery.trim().length > 0) {
            const { sanitizedQuery, sensitiveFound } = this.sanitizeSearchQuery(request.searchQuery.trim());
            if (sensitiveFound) {
              warnings.push('1 sensitive input removed from search query');
            }
            safeQueryText = sanitizedQuery;
          }

          const queryVector = await this.embeddingProvider.generateEmbedding(safeQueryText || 'government welfare scheme');

          // H2 TRUE HYBRID: Vector provider searches the active policy corpus independently.
          // The vector path MUST NOT depend on the structured candidate version IDs.
          vectorMatches = await this.vectorProvider.searchSimilarChunks(queryVector, {
            limit: maxCandidates * 3,
            minScore: request.constraints?.minScore ?? 0.1,
            corpusScope: 'ACTIVE_CURRENT_POLICY_VERSIONS',
          });
        } catch (err: any) {
          this.logger.warn(`Vector search failed during hybrid retrieval: ${err.message}`);
          warnings.push(`Vector search provider error: ${err.message}`);
          vectorSearchAvailable = false;
        }
      }
    }

    // 4. Candidate Union, Deduplication, and Metadata Resolution (H2)
    const allRawPoliciesByVersion = new Map<string, RawCandidatePolicy>();
    for (const p of rawPolicies) {
      allRawPoliciesByVersion.set(p.policyVersionId, p);
    }

    // Identify candidate versions from vector search not present in structured candidates
    const vectorVersionIds = Array.from(new Set(vectorMatches.map((m) => m.versionId)));
    const missingVersionIds = vectorVersionIds.filter((vId) => !allRawPoliciesByVersion.has(vId));

    if (missingVersionIds.length > 0) {
      try {
        const discovered = await this.repository.findCandidatePolicyVersionsByIds(missingVersionIds);
        for (const p of discovered) {
          allRawPoliciesByVersion.set(p.policyVersionId, p);
        }
      } catch (err: any) {
        this.logger.warn(`Failed resolving policy version metadata for vector matches: ${err.message}`);
      }
    }

    // H2-09, H2-10, H2-11: Validate vector matches against active policy versions and matching documentId
    const vectorMatchesByVersion = new Map<string, RawVectorMatch[]>();
    for (const vm of vectorMatches) {
      const rawMeta = allRawPoliciesByVersion.get(vm.versionId);
      if (!rawMeta || rawMeta.policyId !== vm.documentId) {
        // Reject invalid documentId or inactive/superseded versionId
        continue;
      }
      if (!vectorMatchesByVersion.has(vm.versionId)) {
        vectorMatchesByVersion.set(vm.versionId, []);
      }
      vectorMatchesByVersion.get(vm.versionId)!.push(vm);
    }

    // Form the union of candidate policy versions
    const candidateVersionIds = new Set<string>();
    for (const p of rawPolicies) {
      candidateVersionIds.add(p.policyVersionId);
    }
    if (mode === 'HYBRID') {
      for (const vId of vectorMatchesByVersion.keys()) {
        candidateVersionIds.add(vId);
      }
    }

    const candidatesByVersion = new Map<string, CandidatePolicy>();

    for (const versionId of candidateVersionIds) {
      const raw = allRawPoliciesByVersion.get(versionId);
      if (!raw) {
        continue;
      }

      const inStructured = rawPolicies.some((p) => p.policyVersionId === versionId);
      const vMatches = vectorMatchesByVersion.get(versionId) || [];
      const inVector = mode === 'HYBRID' && vMatches.length > 0;

      let retrievalMethod: 'STRUCTURED' | 'VECTOR' | 'HYBRID';
      let finalRetrievalScore: number;
      const matchedSignals: string[] = [];

      // Vector evidence
      const bestVectorScore = inVector ? Math.max(...vMatches.map((m) => m.score)) : undefined;
      const uniqueChunkIds = new Set(vMatches.map((vm) => vm.chunkId).filter(Boolean));
      const vectorMatchedChunkCount = inVector ? vMatches.length : 0;
      const uniqueMatchedChunkCount = inVector ? uniqueChunkIds.size : 0;
      const matchedChunkCount = uniqueMatchedChunkCount;
      const totalChunkCount = raw.chunkCount;
      const matchedChunkTitles = [
        ...raw.sampleChunkTitles,
        ...vMatches.map((m) => m.sectionTitle).filter((t): t is string => Boolean(t)),
      ].slice(0, 3);

      // Structured match flags (truthfully undefined for vector-only candidates)
      let stateMatch: boolean | undefined;
      let categoryMatch: boolean | undefined;
      let departmentMatch: boolean | undefined;
      let ministryMatch: boolean | undefined;
      let policyClassificationMatch: boolean | undefined;
      let matchedSemanticAttributes: string[] = [];

      if (inStructured) {
        const isNationalPolicy =
          !raw.state || raw.state.trim().toLowerCase() === 'all' || raw.state.trim().toLowerCase() === 'national';
        stateMatch = filterState
          ? (raw.state ? raw.state.toLowerCase() === filterState.toLowerCase() : true)
          : (isNationalPolicy ? true : undefined);

        categoryMatch = filterBeneficiaryCat
          ? (raw.beneficiaryCategory ? raw.beneficiaryCategory.toLowerCase() === filterBeneficiaryCat.toLowerCase() : true)
          : undefined;

        departmentMatch = filterDept
          ? Boolean(raw.department && raw.department.toLowerCase() === filterDept.toLowerCase())
          : undefined;

        ministryMatch = filterMinistry
          ? Boolean(raw.ministry && raw.ministry.toLowerCase() === filterMinistry.toLowerCase())
          : undefined;

        policyClassificationMatch = filterClassification
          ? Boolean(raw.classification && raw.classification.toLowerCase() === filterClassification.toLowerCase())
          : undefined;

        if (stateMatch === true) {
          matchedSignals.push(raw.state ? `State: ${raw.state}` : 'National / Universal Applicability');
        }
        if (categoryMatch === true && raw.beneficiaryCategory) {
          matchedSignals.push(`Beneficiary Category: ${raw.beneficiaryCategory}`);
        }
        if (departmentMatch === true && raw.department) {
          matchedSignals.push(`Department: ${raw.department}`);
        }
        if (ministryMatch === true && raw.ministry) {
          matchedSignals.push(`Ministry: ${raw.ministry}`);
        }

        matchedSemanticAttributes = raw.referencedAttributes.filter(
          (attr) =>
            alignedSignals.canonicalAttributesPresent.includes(attr) ||
            alignedSignals.exploratoryAttributeCodes.includes(attr),
        );

        for (const attr of matchedSemanticAttributes) {
          matchedSignals.push(`Semantic Attribute Relevance: ${attr}`);
        }

        let structuredScore = 0.5;
        if (stateMatch === true) structuredScore += 0.1;
        if (categoryMatch === true) structuredScore += 0.1;
        if (departmentMatch === true) structuredScore += 0.05;
        if (ministryMatch === true) structuredScore += 0.05;
        structuredScore += Math.min(matchedSemanticAttributes.length * 0.05, 0.1);
        structuredScore = Math.min(structuredScore, 0.8);

        if (inVector && bestVectorScore !== undefined) {
          retrievalMethod = 'HYBRID';
          finalRetrievalScore = Math.min(structuredScore * 0.6 + bestVectorScore * 0.4, 1.0);
          matchedSignals.push(`Vector Similarity: ${Math.round(bestVectorScore * 100)}%`);
        } else {
          retrievalMethod = 'STRUCTURED';
          finalRetrievalScore = structuredScore;
        }
      } else {
        // VECTOR ONLY (H2-07: no fabricated structured match flags)
        retrievalMethod = 'VECTOR';
        finalRetrievalScore = bestVectorScore ?? 0.5;
        matchedSignals.push(`Vector Similarity: ${Math.round((bestVectorScore ?? 0) * 100)}%`);
      }

      finalRetrievalScore = Math.round(finalRetrievalScore * 10000) / 10000;

      const candidate: CandidatePolicy = {
        policyId: raw.policyId,
        policyVersionId: raw.policyVersionId,
        policyVersionNumber: raw.policyVersionNumber,
        title: raw.title,
        documentNumber: raw.documentNumber,
        classification: raw.classification,
        ministry: raw.ministry,
        department: raw.department,
        retrievalScore: finalRetrievalScore,
        retrievalMethod,
        matchedSignals,
        matchedSemanticAttributes,
        retrievalEvidence: {
          stateMatch,
          beneficiaryCategoryMatch: categoryMatch,
          departmentMatch,
          ministryMatch,
          policyClassificationMatch,
          referencedAttributes: matchedSemanticAttributes,
          vectorScore: bestVectorScore,
          totalChunkCount,
          vectorMatchedChunkCount,
          uniqueMatchedChunkCount,
          matchedChunkCount,
          sampleChunkTitles: matchedChunkTitles,
        },
        provenance: {
          sourceId: raw.sourceId,
          documentId: raw.policyId,
          versionId: raw.policyVersionId,
          retrievedAt: new Date().toISOString(),
        },
      };

      candidatesByVersion.set(versionId, candidate);
    }

    // 5. Deterministic Ranking & Bounded Truncation
    const candidates = Array.from(candidatesByVersion.values());

    // Deterministic 3-tier tie-break:
    // 1. retrievalScore descending
    // 2. documentNumber ascending
    // 3. policyVersionId ascending
    candidates.sort((a, b) => {
      if (b.retrievalScore !== a.retrievalScore) {
        return b.retrievalScore - a.retrievalScore;
      }
      const docCompare = a.documentNumber.localeCompare(b.documentNumber);
      if (docCompare !== 0) {
        return docCompare;
      }
      return a.policyVersionId.localeCompare(b.policyVersionId);
    });

    const totalCandidates = candidates.length; // Total candidates eligible for return before truncation (Finding R12)
    const boundedCandidates = candidates.slice(0, maxCandidates);
    const returnedCandidates = boundedCandidates.length;

    // 6. Determine Final Retrieval Status
    let status: RetrievalStatus = 'SUCCESS';
    if (boundedCandidates.length === 0) {
      status = 'NO_RESULTS';
    } else if (mode === 'HYBRID' && !vectorSearchAvailable) {
      status = 'PARTIAL_RESULTS';
    }

    const durationMs = Date.now() - startTime;
    this.logger.log(`Candidate Retrieval completed [Trace: ${traceId}, Status: ${status}, Count: ${returnedCandidates}, Duration: ${durationMs}ms]`);

    // Truthful appliedFilters: only report filters that were actually applied (Finding R2, R9)
    const appliedFilters: Record<string, unknown> = {};
    if (filterState) appliedFilters.state = filterState;
    if (filterBeneficiaryCat) appliedFilters.beneficiaryCategory = filterBeneficiaryCat;
    if (filterClassification) appliedFilters.policyClassification = filterClassification;
    if (filterDept) appliedFilters.department = filterDept;
    if (filterMinistry) appliedFilters.ministry = filterMinistry;
    if (alignedSignals.canonicalAttributesPresent.length > 0) {
      appliedFilters.relevantAttributeCodes = alignedSignals.canonicalAttributesPresent;
    }

    return {
      status,
      candidates: boundedCandidates,
      returnedCandidates,
      totalCandidates,
      searchDurationMs: durationMs,
      searchMode: mode,
      appliedFilters,
      warnings: warnings.length > 0 ? warnings : undefined,
      executionTraceId: traceId,
    };
  }

  /**
   * Deterministic PII detection and redaction for free-text search queries (Finding R3).
   * Strips Aadhaar (12-digit), PAN (10-char alphanumeric), and bank account numbers (9-18 digits).
   */
  private sanitizeSearchQuery(query: string): { sanitizedQuery: string; sensitiveFound: boolean } {
    let sanitized = query;
    let sensitiveFound = false;

    // Aadhaar: 12-digit sequence with optional separators
    const aadhaarPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{12}\b/g;
    if (aadhaarPattern.test(sanitized)) {
      sensitiveFound = true;
      sanitized = sanitized.replace(aadhaarPattern, '[REDACTED_IDENTIFIER]');
    }

    // PAN: 5 letters, 4 digits, 1 letter
    const panPattern = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g;
    if (panPattern.test(sanitized)) {
      sensitiveFound = true;
      sanitized = sanitized.replace(panPattern, '[REDACTED_IDENTIFIER]');
    }

    // Bank Account: 9 to 18 contiguous digits
    const bankPattern = /\b\d{9,18}\b/g;
    if (bankPattern.test(sanitized)) {
      sensitiveFound = true;
      sanitized = sanitized.replace(bankPattern, '[REDACTED_IDENTIFIER]');
    }

    return { sanitizedQuery: sanitized, sensitiveFound };
  }
}
