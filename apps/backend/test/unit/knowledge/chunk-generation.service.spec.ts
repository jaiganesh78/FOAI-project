import { describe, it, expect } from 'vitest';
import { ChunkGenerationService } from '../../../src/modules/knowledge/services/chunk-generation.service';

describe('ChunkGenerationService', () => {
  const service = new ChunkGenerationService();

  it('should generate chunks with stable chunk IDs and lineage checksums', () => {
    const parsedDoc = {
      title: 'Sample Scheme',
      sections: [
        {
          sectionTitle: 'Eligibility Criteria',
          pageNumber: 1,
          paragraphIndex: 1,
          text: 'Farmers holding less than 2 hectares of land are eligible for this grant.',
        },
      ],
      rawText: 'Farmers holding less than 2 hectares of land are eligible for this grant.',
    };

    const chunks = service.generateChunks(parsedDoc);

    expect(chunks.length).toBe(1);
    expect(chunks[0].sectionTitle).toBe('Eligibility Criteria');
    expect(chunks[0].stableChunkId).toBeDefined();
    expect(chunks[0].checksum).toBeDefined();
  });
});
