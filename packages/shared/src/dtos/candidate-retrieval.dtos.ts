import {
  RetrievalMode,
  RetrievalStatus,
  CandidatePolicy,
  RetrievalEvidence,
  CandidatePolicyProvenance,
  CandidateRetrievalConstraints,
  CandidateRetrievalCitizenContext,
} from '../interfaces/candidate-retrieval.interface';

export class CandidateRetrievalConstraintsDto implements CandidateRetrievalConstraints {
  state?: string;
  policyClassification?: string;
  beneficiaryCategory?: string;
  ministry?: string;
  department?: string;
  maxCandidates?: number = 10;
  minScore?: number = 0.1;
}

export class CandidateRetrievalCitizenContextDto implements CandidateRetrievalCitizenContext {
  userId?: string;
  authoritativeCitizenFacts?: Record<string, unknown>;
  retrievalHints?: Record<string, unknown>;
  facts?: Record<string, unknown>;
}

export class CandidateRetrievalRequestDto {
  citizenContext!: CandidateRetrievalCitizenContextDto;
  searchQuery?: string;
  constraints?: CandidateRetrievalConstraintsDto;
  mode?: RetrievalMode = 'STRUCTURED_ONLY';
}

export class CandidatePolicyDto implements CandidatePolicy {
  policyId!: string;
  policyVersionId!: string;
  policyVersionNumber!: number;
  title!: string;
  documentNumber!: string;
  classification!: string;
  retrievalScore!: number;
  retrievalMethod!: 'STRUCTURED' | 'VECTOR' | 'HYBRID';
  matchedSignals!: string[];
  matchedSemanticAttributes!: string[];
  retrievalEvidence!: RetrievalEvidence;
  provenance!: CandidatePolicyProvenance;
}

export class CandidateRetrievalResultDto {
  status!: RetrievalStatus;
  candidates!: CandidatePolicyDto[];
  totalCandidates!: number;
  searchDurationMs!: number;
  searchMode!: RetrievalMode;
  appliedFilters!: Record<string, unknown>;
  warnings?: string[];
  executionTraceId!: string;
}
