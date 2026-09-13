/**
 * Candidate Retrieval & Semantic Alignment Contracts (Sprint 12B)
 *
 * Establishes domain contracts for retrieving a bounded candidate set of policy versions.
 *
 * CRITICAL ARCHITECTURAL INVARIANTS:
 * 1. S12B answers: "Which policies are worth evaluating?" — NEVER "Is the citizen eligible?".
 * 2. Retrieval Score = Deterministic candidate-ranking / relevance score (0.0 to 1.0).
 *    It is NOT:
 *    - eligibility probability
 *    - eligibility confidence
 *    - semantic certainty
 *    - policy validity
 *    - probability of approval
 *    The score must never be consumed by S13 as an eligibility signal.
 * 3. Categorical distinctions are strictly maintained without conflation:
 *    - policyClassification (e.g. SCHEME, GUIDELINE) != beneficiaryCategory (e.g. FARMER, STUDENT)
 *    - socialCategory (caste: GENERAL, OBC, SC, ST) != ewsStatus (economic boolean status)
 * 4. Zero-AI semantic authority: vector similarity cannot prove fact truth or eligibility.
 */

export type RetrievalMode = 'STRUCTURED_ONLY' | 'HYBRID';
export type RetrievalStatus = 'SUCCESS' | 'NO_RESULTS' | 'PARTIAL_RESULTS' | 'RETRIEVAL_FAILURE';

export interface CandidateRetrievalConstraints {
  state?: string;
  policyClassification?: string;
  beneficiaryCategory?: string;
  ministry?: string;
  department?: string;
  maxCandidates?: number;
  minScore?: number;
}

/**
 * Citizen context for candidate retrieval with strict trust boundary separation (H1).
 *
 * TRUST BOUNDARY SPECIFICATION:
 * - authoritativeCitizenFacts: Facts loaded strictly server-side from CitizenQueryService.
 *   These are trusted citizen facts for canonical semantic reasoning.
 * - retrievalHints: Optional caller-provided values that may guide candidate discovery.
 *   These are NOT authoritative facts. They must NEVER enter canonicalFacts, must NEVER
 *   mutate citizen state, and must NEVER cross the S12 -> S13 firewall.
 * - facts: Backward-compatibility property. Any client-provided facts are treated
 *   strictly as retrievalHints, NEVER as authoritativeCitizenFacts.
 */
export interface CandidateRetrievalCitizenContext {
  userId?: string;
  authoritativeCitizenFacts?: Record<string, unknown>;
  retrievalHints?: Record<string, unknown>;
  facts?: Record<string, unknown>;
}

export interface CandidateRetrievalRequest {
  citizenContext: CandidateRetrievalCitizenContext;
  searchQuery?: string;
  constraints?: CandidateRetrievalConstraints;
  mode?: RetrievalMode;
}

export interface RetrievalEvidence {
  stateMatch?: boolean;
  beneficiaryCategoryMatch?: boolean;
  policyClassificationMatch?: boolean;
  departmentMatch?: boolean;
  ministryMatch?: boolean;
  referencedAttributes: string[];
  vectorScore?: number;
  totalChunkCount: number;
  vectorMatchedChunkCount: number;
  uniqueMatchedChunkCount: number;
  matchedChunkCount: number;
  sampleChunkTitles: string[];
}

export interface CandidatePolicyProvenance {
  sourceId?: string;
  documentId: string;
  versionId: string;
  retrievedAt: string;
}

export interface CandidatePolicy {
  policyId: string;
  policyVersionId: string;
  policyVersionNumber: number;
  title: string;
  documentNumber: string;
  classification: string;
  ministry?: string | null;
  department?: string | null;
  /**
   * Deterministic candidate-ranking / relevance score (0.0 to 1.0).
   * Strictly NOT an eligibility probability or confidence score.
   */
  retrievalScore: number;
  retrievalMethod: 'STRUCTURED' | 'VECTOR' | 'HYBRID';
  matchedSignals: string[];
  matchedSemanticAttributes: string[];
  retrievalEvidence: RetrievalEvidence;
  provenance: CandidatePolicyProvenance;
}

export interface CandidateRetrievalResult {
  status: RetrievalStatus;
  candidates: CandidatePolicy[];
  returnedCandidates: number;
  /**
   * Total qualifying candidates discovered within the bounded retrieval working set
   * prior to limit truncation (maxCandidates).
   * Note: In accordance with GAP-RET-003, this represents the qualifying working-set count,
   * not an unbounded full-corpus COUNT(*).
   */
  totalCandidates: number;
  searchDurationMs: number;
  searchMode: RetrievalMode;
  appliedFilters: Record<string, unknown>;
  warnings?: string[];
  executionTraceId: string;
}

/**
 * Aligned citizen signals produced by SemanticAlignmentService.
 * Contains retrieval-specific typed fields and a scalable generic map
 * of canonical attributes to support future domains without hardcoded bloat.
 * Structurally separates authoritative citizen facts from exploratory retrieval hints (H1).
 */
export interface AlignedCitizenSignals {
  // Authoritative retrieval-specific typed fields
  state?: string;
  socialCategory?: string;
  ewsStatus?: boolean;
  beneficiaryCategory?: string;
  primaryOccupation?: string;
  landHoldingHectares?: number;
  annualIncomeInr?: number;
  ageYears?: number;
  gender?: string;

  // Authoritative canonical facts (solely from authoritativeCitizenFacts, validated against frozen registry)
  canonicalFacts: Record<string, unknown>;
  canonicalAttributesPresent: string[];

  // Exploratory retrieval signals (derived strictly from retrievalHints; NEVER authoritative)
  exploratoryHints: Record<string, unknown>;
  exploratoryAttributeCodes: string[];
  exploratoryState?: string;
  exploratoryBeneficiaryCategory?: string;
  exploratoryPrimaryOccupation?: string;
  exploratoryAgeYears?: number;

  // Fact provenance mapping (explicitly tags each attribute as AUTHORITATIVE or EXPLORATORY_HINT)
  factProvenance: Record<string, 'AUTHORITATIVE' | 'EXPLORATORY_HINT'>;

  // Unresolved & ambiguous tracking (no unvalidated inference)
  unresolvedInputs: string[];
  ambiguousInputs: string[];
}

/**
 * S13 Eligibility Firewall Interface (H1 Architectural Firewall)
 *
 * Enforces that only authoritative citizen facts may cross into S13 eligibility reasoning.
 * Retrieval hints are strictly forbidden from entering downstream rule evaluation.
 */
export interface S13AuthoritativeCitizenEvaluationContext {
  userId?: string;
  authoritativeCitizenFacts: Record<string, unknown>;
  canonicalFacts: Record<string, unknown>;
  canonicalAttributesPresent: string[];
}

/**
 * Extracts strictly authoritative citizen context for S13 eligibility evaluation.
 * Strips all exploratory hints, ensuring zero trust-boundary contamination.
 */
export function extractS13AuthoritativeContext(
  request: CandidateRetrievalRequest,
  alignedSignals: AlignedCitizenSignals,
): S13AuthoritativeCitizenEvaluationContext {
  return {
    userId: request.citizenContext.userId,
    authoritativeCitizenFacts: request.citizenContext.authoritativeCitizenFacts || {},
    canonicalFacts: alignedSignals.canonicalFacts,
    canonicalAttributesPresent: alignedSignals.canonicalAttributesPresent,
  };
}
