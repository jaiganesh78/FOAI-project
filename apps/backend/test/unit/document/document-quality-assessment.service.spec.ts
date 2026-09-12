import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentQualityAssessmentService } from '../../../src/modules/document/services/document-quality-assessment.service';
import { DocumentQualityGrade, OCRReadiness } from '@gpios/shared';

describe('DocumentQualityAssessmentService', () => {
  let service: DocumentQualityAssessmentService;

  beforeEach(() => {
    service = new DocumentQualityAssessmentService();
  });

  it('should assess standard document quality as EXCELLENT', () => {
    const result = service.assessQuality('doc-1', 200000, 'application/pdf');
    expect(result.qualityScore).toBe(95.0);
    expect(result.qualityGrade).toBe(DocumentQualityGrade.EXCELLENT);
    expect(result.ocrReadiness).toBe(OCRReadiness.READY);
  });

  it('should flag low file size as POOR quality', () => {
    const result = service.assessQuality('doc-2', 5000, 'image/jpeg');
    expect(result.qualityScore).toBe(40.0);
    expect(result.qualityGrade).toBe(DocumentQualityGrade.POOR);
    expect(result.ocrReadiness).toBe(OCRReadiness.NEEDS_PREPROCESSING);
    expect(result.issues).toContain('Low image resolution or small file size');
  });
});
