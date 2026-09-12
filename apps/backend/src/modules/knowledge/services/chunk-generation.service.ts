import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ParsedDocumentResult } from '../parsers/parser.interface';

export interface GeneratedChunk {
  stableChunkId: string;
  chunkIndex: number;
  sectionTitle?: string;
  pageNumber?: number;
  paragraphIndex?: number;
  content: string;
  checksum: string;
}

@Injectable()
export class ChunkGenerationService {
  generateChunks(parsedDoc: ParsedDocumentResult, maxChunkSize = 1000, overlap = 200): GeneratedChunk[] {
    const chunks: GeneratedChunk[] = [];
    let globalIndex = 0;

    for (const sec of parsedDoc.sections) {
      const text = sec.text;
      if (text.length <= maxChunkSize) {
        const checksum = this.calculateChecksum(text);
        const stableChunkId = this.generateStableChunkId(sec.sectionTitle || 'main', text);
        chunks.push({
          stableChunkId,
          chunkIndex: globalIndex++,
          sectionTitle: sec.sectionTitle,
          pageNumber: sec.pageNumber,
          paragraphIndex: sec.paragraphIndex,
          content: text,
          checksum,
        });
      } else {
        // Sliding window chunking with overlap
        let start = 0;
        while (start < text.length) {
          const end = Math.min(start + maxChunkSize, text.length);
          const chunkText = text.substring(start, end).trim();
          const checksum = this.calculateChecksum(chunkText);
          const stableChunkId = this.generateStableChunkId(sec.sectionTitle || 'main', chunkText);

          chunks.push({
            stableChunkId,
            chunkIndex: globalIndex++,
            sectionTitle: sec.sectionTitle,
            pageNumber: sec.pageNumber,
            paragraphIndex: sec.paragraphIndex,
            content: chunkText,
            checksum,
          });

          start += maxChunkSize - overlap;
          if (start >= text.length) break;
        }
      }
    }

    return chunks;
  }

  private calculateChecksum(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  private generateStableChunkId(section: string, content: string): string {
    return createHash('sha256').update(section).update(content).digest('hex').substring(0, 16);
  }
}
