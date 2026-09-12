import { describe, it, expect } from 'vitest';
import { KnowledgeQualityService } from '../../../src/modules/knowledge/services/knowledge-quality.service';

describe('KnowledgeQualityService', () => {
  const service = new KnowledgeQualityService();

  it('should evaluate quality report metrics', () => {
    const chunks = [{ stableChunkId: 'st-1', chunkIndex: 0, content: 'Test text', checksum: 'hash' }];
    const metadata = {
      schemeName: 'PM KISAN',
      extractionConfidence: 0.95,
      extractionMethod: 'DETERMINISTIC',
      extractedBy: 'SYSTEM',
      sourceLocation: 'Title',
    };

    const quality = service.evaluateQuality(chunks, metadata);

    expect(quality.completenessScore).toBe(1.0);
    expect(quality.parsingSuccess).toBe(true);
    expect(quality.chunkCoverage).toBe(1.0);
  });
});
