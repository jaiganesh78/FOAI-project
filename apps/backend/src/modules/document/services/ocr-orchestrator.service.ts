import { Injectable } from '@nestjs/common';
import { OCRResultDto } from '@gpios/shared';

@Injectable()
export class OCROrchestratorService {
  async processOCR(documentId: string, _templateId?: string): Promise<{ result: OCRResultDto; blocks: any[] }> {
    const jobId = `ocr-job-${documentId}`;
    const blocks = [
      { blockType: 'HEADER', text: 'INCOME CERTIFICATE GOVERNMENT OF TAMIL NADU', confidence: 0.98 },
      { blockType: 'FIELD_KEY_VALUE', text: 'Annual Income: 200000', confidence: 0.95 },
      { blockType: 'FIELD_KEY_VALUE', text: 'Aadhaar: 123456789012', confidence: 0.96 },
    ];

    return {
      result: {
        jobId,
        documentId,
        status: 'COMPLETED',
        totalBlocks: blocks.length,
        averageConfidence: 0.96,
        extractedFactsCount: 2,
        completedAt: new Date().toISOString(),
      },
      blocks,
    };
  }
}
