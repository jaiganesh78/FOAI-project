import { Injectable } from '@nestjs/common';
import { GeneratedChunk } from './chunk-generation.service';
import { NormalizedMetadataResult } from './policy-normalization.service';

export interface QualityReportResult {
  completenessScore: number;
  parsingSuccess: boolean;
  metadataConfidence: number;
  duplicateConfidence: number;
  chunkCoverage: number;
  normalizationSuccess: boolean;
}

@Injectable()
export class KnowledgeQualityService {
  evaluateQuality(chunks: GeneratedChunk[], metadata: NormalizedMetadataResult): QualityReportResult {
    const chunkCoverage = chunks.length > 0 ? 1.0 : 0.0;
    const metadataConfidence = metadata.extractionConfidence || 0.9;
    const completenessScore = metadata.schemeName && chunks.length > 0 ? 1.0 : 0.8;

    return {
      completenessScore,
      parsingSuccess: true,
      metadataConfidence,
      duplicateConfidence: 1.0,
      chunkCoverage,
      normalizationSuccess: metadata.normalizedAmount !== undefined || metadata.normalizedStateCode !== undefined,
    };
  }
}
