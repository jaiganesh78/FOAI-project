import { Injectable } from '@nestjs/common';
import { GeneratedChunk } from './chunk-generation.service';
import { QualityReportResult } from './knowledge-quality.service';

@Injectable()
export class KnowledgeIntegrityVerificationService {
  verifyIntegrity(chunks: GeneratedChunk[], quality: QualityReportResult): boolean {
    if (chunks.length === 0) return false;
    if (!quality.parsingSuccess) return false;
    if (quality.completenessScore < 0.5) return false;

    for (const chunk of chunks) {
      if (!chunk.content || chunk.content.trim().length === 0) return false;
      if (!chunk.stableChunkId) return false;
    }

    return true;
  }
}
