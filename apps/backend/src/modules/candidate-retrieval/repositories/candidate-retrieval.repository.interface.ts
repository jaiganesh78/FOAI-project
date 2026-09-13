export interface StructuredFilterCriteria {
  state?: string;
  policyClassification?: string;
  beneficiaryCategory?: string;
  ministry?: string;
  department?: string;
  relevantAttributeCodes?: string[];
  limit?: number;
}

export interface RawCandidatePolicy {
  policyId: string;
  policyVersionId: string;
  policyVersionNumber: number;
  title: string;
  documentNumber: string;
  classification: string;
  sourceId?: string;
  state?: string | null;
  beneficiaryCategory?: string | null;
  ministry?: string | null;
  department?: string | null;
  referencedAttributes: string[];
  chunkCount: number;
  sampleChunkTitles: string[];
}

export interface ICandidateRetrievalRepository {
  findStructuredCandidates(criteria: StructuredFilterCriteria): Promise<RawCandidatePolicy[]>;
  /**
   * Resolves raw candidate policy metadata for candidate versions discovered independently
   * by vector search. Ensures version safety: only returns active, non-deleted, current versions.
   */
  findCandidatePolicyVersionsByIds(versionIds: string[]): Promise<RawCandidatePolicy[]>;
}
