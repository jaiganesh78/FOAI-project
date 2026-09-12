import { Injectable } from '@nestjs/common';
import { EvidenceTrustScoreDto, DocumentConfidenceLevel } from '@gpios/shared';

@Injectable()
export class EvidenceTrustScoreService {
  calculateTrustScore(params: {
    evidenceId: string;
    documentAgeDays?: number;
    verificationMethodWeight?: number;
    governmentSourceWeight?: number;
    manualVerificationBonus?: number;
    ocrQualityScore?: number;
    documentQualityScore?: number;
    extractionConfidence?: number;
    conflictHistoryPenalty?: number;
  }): EvidenceTrustScoreDto {
    const ageDays = params.documentAgeDays ?? 10;
    const methodWeight = params.verificationMethodWeight ?? 1.0;
    const sourceWeight = params.governmentSourceWeight ?? 1.0;
    const manualBonus = params.manualVerificationBonus ?? 0.0;
    const ocrQuality = params.ocrQualityScore ?? 95.0;
    const docQuality = params.documentQualityScore ?? 95.0;
    const extractConf = params.extractionConfidence ?? 95.0;
    const penalty = params.conflictHistoryPenalty ?? 0.0;

    let trustScore = Math.round(
      (ocrQuality * 0.25 + docQuality * 0.25 + extractConf * 0.3) * methodWeight * sourceWeight +
        manualBonus -
        penalty,
    );

    if (ageDays > 365) trustScore -= 10;
    trustScore = Math.max(0, Math.min(100, trustScore));

    let confidenceLevel = DocumentConfidenceLevel.HIGH;
    if (trustScore >= 90) confidenceLevel = DocumentConfidenceLevel.CRITICAL;
    else if (trustScore >= 75) confidenceLevel = DocumentConfidenceLevel.HIGH;
    else if (trustScore >= 50) confidenceLevel = DocumentConfidenceLevel.MEDIUM;
    else confidenceLevel = DocumentConfidenceLevel.LOW;

    return {
      evidenceId: params.evidenceId,
      trustScore,
      documentAgeDays: ageDays,
      verificationMethodWeight: methodWeight,
      governmentSourceWeight: sourceWeight,
      manualVerificationBonus: manualBonus,
      ocrQualityScore: ocrQuality,
      documentQualityScore: docQuality,
      extractionConfidence: extractConf,
      conflictHistoryPenalty: penalty,
      confidenceLevel,
    };
  }
}
