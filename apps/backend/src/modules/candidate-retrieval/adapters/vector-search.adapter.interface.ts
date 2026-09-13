export type VectorCorpusScope = 'ACTIVE_CURRENT_POLICY_VERSIONS' | 'ALL';

export interface VectorSearchOptions {
  limit: number;
  minScore?: number;
  /**
   * Scope of the vector corpus to search independently.
   * Defaults to ACTIVE_CURRENT_POLICY_VERSIONS.
   */
  corpusScope?: VectorCorpusScope;
  /**
   * Optional explicit version scope filter (NOT for constraining vector search
   * to structured retrieval results).
   */
  allowedVersionScope?: string[];
  /**
   * Backward-compatibility alias for allowedVersionScope.
   */
  versionFilter?: string[];
}

export interface RawVectorMatch {
  chunkId: string;
  documentId: string;
  versionId: string;
  /**
   * Normalized relevance score in [0.0, 1.0] derived linearly from cosine similarity:
   * normalizedScore = (rawCosine + 1) / 2
   */
  score: number;
  /**
   * Mathematically exact cosine similarity in [-1.0, 1.0].
   */
  rawCosine?: number;
  sectionTitle?: string;
}

export interface IVectorSearchProvider {
  searchSimilarChunks(queryVector: number[], options: VectorSearchOptions): Promise<RawVectorMatch[]>;
  isAvailable(): boolean;
}
