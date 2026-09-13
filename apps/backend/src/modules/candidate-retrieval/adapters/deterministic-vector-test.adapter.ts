import { Injectable, Logger } from '@nestjs/common';
import { IVectorSearchProvider, VectorSearchOptions, RawVectorMatch } from './vector-search.adapter.interface';

export interface FixtureChunkVector {
  chunkId: string;
  documentId: string;
  versionId: string;
  sectionTitle?: string;
  vector: number[];
}

/**
 * DeterministicVectorTestAdapter
 *
 * Designed exclusively for unit, integration, and adversarial testing in S12B.
 *
 * CRITICAL SPECIFICATION:
 * - Operates on deterministic test vectors and calculates mathematical cosine similarity.
 * - Does NOT claim to reproduce the production text-to-embedding pipeline.
 * - Architecture:
 *   deterministic query vector + deterministic fixture chunk vectors
 *         ↓
 *   cosine similarity
 *         ↓
 *   RawVectorMatch
 * - Production embedding generation and vector persistence remain separate deferred capabilities.
 */
@Injectable()
export class DeterministicVectorTestAdapter implements IVectorSearchProvider {
  private readonly logger = new Logger(DeterministicVectorTestAdapter.name);
  private available = true;
  private simulatedError: Error | null = null;
  private readonly fixtures: Map<string, FixtureChunkVector> = new Map();

  setAvailable(status: boolean): void {
    this.available = status;
  }

  setSimulatedError(err: Error | null): void {
    this.simulatedError = err;
  }

  isAvailable(): boolean {
    return this.available && this.simulatedError === null;
  }

  registerFixtureVector(fixture: FixtureChunkVector): void {
    this.fixtures.set(fixture.chunkId, fixture);
  }

  clearFixtures(): void {
    this.fixtures.clear();
  }

  async searchSimilarChunks(queryVector: number[], options: VectorSearchOptions): Promise<RawVectorMatch[]> {
    if (this.simulatedError) {
      this.logger.warn(`Vector search failing with simulated error: ${this.simulatedError.message}`);
      throw this.simulatedError;
    }

    if (!this.available) {
      return [];
    }

    const matches: RawVectorMatch[] = [];
    const minScore = options.minScore ?? 0.0;

    for (const fixture of this.fixtures.values()) {
      const allowedScope = options.allowedVersionScope || options.versionFilter;
      if (allowedScope && allowedScope.length > 0) {
        if (!allowedScope.includes(fixture.versionId)) {
          continue;
        }
      }

      const rawCosine = this.calculateCosineSimilarity(queryVector, fixture.vector);
      // Explicitly documented linear normalization: normalizedScore = (rawCosine + 1) / 2
      // Maps [-1.0, 1.0] to [0.0, 1.0] without distortion or arbitrary clamping
      const normalizedScore = (rawCosine + 1) / 2;

      if (normalizedScore >= minScore) {
        matches.push({
          chunkId: fixture.chunkId,
          documentId: fixture.documentId,
          versionId: fixture.versionId,
          score: Math.round(normalizedScore * 10000) / 10000,
          rawCosine: Math.round(rawCosine * 10000) / 10000,
          sectionTitle: fixture.sectionTitle,
        });
      }
    }

    // Sort descending by similarity score
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, options.limit);
  }

  /**
   * Calculates mathematically exact cosine similarity in [-1.0, 1.0].
   * Handles empty vectors, dimension mismatches, zero-norm vectors, and non-finite values (NaN, Infinity).
   */
  calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0.0;
    }

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i];
      const b = vecB[i];

      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return 0.0;
      }

      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA <= 0.0 || normB <= 0.0) {
      return 0.0;
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (!Number.isFinite(denom) || denom <= 0.0) {
      return 0.0;
    }

    const similarity = dotProduct / denom;
    if (!Number.isFinite(similarity)) {
      return 0.0;
    }

    return Math.max(-1.0, Math.min(1.0, similarity));
  }
}
