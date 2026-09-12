import { Injectable } from '@nestjs/common';
import { DocumentConfidenceLevel } from '@gpios/shared';

@Injectable()
export class ConfidenceCalculationService {
  calculateOverallConfidence(params: {
    ocrConfidence: number;
    sourceTrust: number;
    verificationConfidence: number;
    extractionConfidence: number;
  }): { overallConfidence: number; level: DocumentConfidenceLevel } {
    const overallConfidence = Math.round(
      params.ocrConfidence * 0.25 +
        params.sourceTrust * 0.25 +
        params.verificationConfidence * 0.25 +
        params.extractionConfidence * 0.25,
    );

    let level = DocumentConfidenceLevel.HIGH;
    if (overallConfidence >= 90) level = DocumentConfidenceLevel.CRITICAL;
    else if (overallConfidence >= 75) level = DocumentConfidenceLevel.HIGH;
    else if (overallConfidence >= 50) level = DocumentConfidenceLevel.MEDIUM;
    else level = DocumentConfidenceLevel.LOW;

    return { overallConfidence, level };
  }
}
