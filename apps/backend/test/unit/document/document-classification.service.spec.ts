import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentClassificationService } from '../../../src/modules/document/services/document-classification.service';
import { DocumentType } from '@gpios/shared';

describe('DocumentClassificationService', () => {
  let service: DocumentClassificationService;

  beforeEach(() => {
    service = new DocumentClassificationService();
  });

  it('should classify income certificate correctly', () => {
    const result = service.classifyDocument('doc-1', 'income_certificate_2026.pdf', 'application/pdf', 50000);
    expect(result.documentCategory).toBe(DocumentType.INCOME_CERTIFICATE);
    expect(result.ocrTemplateId).toBe('TPL_INCOME_CERT_V1');
    expect(result.isOcrRequired).toBe(true);
  });

  it('should classify aadhaar card correctly', () => {
    const result = service.classifyDocument('doc-2', 'aadhaar_card.png', 'image/png', 150000);
    expect(result.documentCategory).toBe(DocumentType.IDENTITY_PROOF);
    expect(result.ocrTemplateId).toBe('TPL_AADHAAR_CARD_V1');
  });
});
