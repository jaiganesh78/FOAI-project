import { Injectable } from '@nestjs/common';
import { DocumentQualityDto, DocumentQualityGrade, OCRReadiness } from '@gpios/shared';

@Injectable()
export class DocumentQualityAssessmentService {
  assessQuality(documentId: string, fileSize: number, mimeType: string): DocumentQualityDto {
    const issues: string[] = [];
    const recommendedFixes: string[] = [];
    let qualityScore = 95.0;
    let qualityGrade = DocumentQualityGrade.EXCELLENT;
    let ocrReadiness = OCRReadiness.READY;

    if (fileSize < 1024 * 10) {
      // < 10 KB low quality
      qualityScore = 40.0;
      qualityGrade = DocumentQualityGrade.POOR;
      ocrReadiness = OCRReadiness.NEEDS_PREPROCESSING;
      issues.push('Low image resolution or small file size');
      recommendedFixes.push('Re-upload a higher resolution scan (> 100 KB)');
    }

    if (!mimeType.includes('pdf') && !mimeType.includes('image')) {
      qualityScore = 10.0;
      qualityGrade = DocumentQualityGrade.UNUSABLE;
      ocrReadiness = OCRReadiness.UNUSABLE;
      issues.push('Unsupported mime type');
      recommendedFixes.push('Upload PDF, PNG, or JPEG format');
    }

    return {
      documentId,
      qualityScore,
      qualityGrade,
      ocrReadiness,
      resolutionDpi: 300,
      isBlurred: false,
      noiseLevel: 'LOW',
      contrastScore: 0.9,
      issues,
      recommendedFixes,
    };
  }
}
