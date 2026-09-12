import { describe, it, expect, beforeEach } from 'vitest';
import { EvidenceTrustScoreService } from '../../../src/modules/document/services/evidence-trust-score.service';
import { DocumentConfidenceLevel } from '@gpios/shared';

describe('EvidenceTrustScoreService', () => {
  let service: EvidenceTrustScoreService;

  beforeEach(() => {
    service = new EvidenceTrustScoreService();
  });

  it('should compute high trust score for verified document', () => {
    const result = service.calculateTrustScore({
      evidenceId: 'ev-1',
      documentAgeDays: 30,
      ocrQualityScore: 95.0,
      documentQualityScore: 95.0,
      extractionConfidence: 95.0,
    });
    expect(result.trustScore).toBeGreaterThanOrEqual(75);
    expect(result.confidenceLevel).toBe(DocumentConfidenceLevel.HIGH);
  });
});
