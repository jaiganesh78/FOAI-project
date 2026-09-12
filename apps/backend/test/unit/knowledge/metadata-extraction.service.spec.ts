import { describe, it, expect } from 'vitest';
import { MetadataExtractionService } from '../../../src/modules/knowledge/services/metadata-extraction.service';

describe('MetadataExtractionService', () => {
  const service = new MetadataExtractionService();

  it('should extract ministry, beneficiary category, state, and raw amount from policy text', () => {
    const text = 'Financial grant of Rs 2 Lakhs for eligible farmers in Tamil Nadu under Agriculture Department.';
    const title = 'Tamil Nadu Farmer Scheme';

    const result = service.extractMetadata(text, title);

    expect(result.ministry).toBe('Ministry of Agriculture');
    expect(result.state).toBe('Tamil Nadu');
    expect(result.beneficiaryCategory).toBe('FARMER');
    expect(result.rawAmountText).toBe('Rs 2 Lakh');
    expect(result.extractionConfidence).toBe(0.95);
  });
});
