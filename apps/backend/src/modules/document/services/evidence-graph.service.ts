import { Injectable } from '@nestjs/common';
import { EvidenceGraphDto } from '@gpios/shared';

@Injectable()
export class EvidenceGraphService {
  buildProvenanceGraph(params: {
    evidenceId: string;
    factKey: string;
    documentId: string;
    fileName: string;
    ocrBlockId?: string;
  }): EvidenceGraphDto {
    const provenanceChain = [
      `File: ${params.fileName}`,
      `DocumentId: ${params.documentId}`,
      params.ocrBlockId ? `OCRBlockId: ${params.ocrBlockId}` : `OCR: KeyValuePair`,
      `EvidenceId: ${params.evidenceId}`,
      `FactKey: ${params.factKey}`,
    ];

    return {
      evidenceId: params.evidenceId,
      factKey: params.factKey,
      documentId: params.documentId,
      ocrBlockId: params.ocrBlockId,
      originalFileName: params.fileName,
      provenanceChain,
    };
  }
}
