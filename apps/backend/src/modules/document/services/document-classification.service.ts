import { Injectable } from '@nestjs/common';
import { DocumentType, DocumentClassificationDto } from '@gpios/shared';

@Injectable()
export class DocumentClassificationService {
  classifyDocument(documentId: string, fileName: string, mimeType: string, _fileSize: number): DocumentClassificationDto {
    const lowerName = fileName.toLowerCase();
    let documentCategory: DocumentType = DocumentType.OTHER;
    let ocrTemplateId: string | undefined;

    if (lowerName.includes('income') || lowerName.includes('salary')) {
      documentCategory = DocumentType.INCOME_CERTIFICATE;
      ocrTemplateId = 'TPL_INCOME_CERT_V1';
    } else if (lowerName.includes('aadhaar') || lowerName.includes('id')) {
      documentCategory = DocumentType.IDENTITY_PROOF;
      ocrTemplateId = 'TPL_AADHAAR_CARD_V1';
    } else if (lowerName.includes('patta') || lowerName.includes('land')) {
      documentCategory = DocumentType.LAND_RECORD;
    } else if (lowerName.includes('passbook') || lowerName.includes('bank')) {
      documentCategory = DocumentType.BANK_PASSBOOK;
    }

    const isEncrypted = lowerName.includes('protected') || lowerName.includes('locked');
    const isSupported = mimeType.includes('pdf') || mimeType.includes('image');

    return {
      documentId,
      documentCategory,
      detectedLanguage: 'en',
      pageOrientation: 'PORTRAIT',
      layoutType: 'SINGLE_PAGE',
      ocrTemplateId,
      isOcrRequired: true,
      isEncrypted,
      isSupported,
      classificationConfidence: 0.95,
    };
  }
}
