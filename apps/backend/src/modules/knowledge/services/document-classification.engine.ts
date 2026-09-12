import { Injectable } from '@nestjs/common';
import { DocumentClassification } from '@prisma/client';

@Injectable()
export class DocumentClassificationEngine {
  classify(title: string, rawText: string): DocumentClassification {
    const text = (title + ' ' + rawText).toLowerCase();

    if (text.includes('gazette')) return DocumentClassification.GAZETTE;
    if (text.includes('scheme') || text.includes('yojana') || text.includes('kisan')) return DocumentClassification.SCHEME;
    if (text.includes('budget')) return DocumentClassification.BUDGET;
    if (text.includes('scholarship')) return DocumentClassification.SCHEME;
    if (text.includes('circular')) return DocumentClassification.CIRCULAR;
    if (text.includes('notification')) return DocumentClassification.NOTIFICATION;
    if (text.includes('guideline')) return DocumentClassification.GUIDELINE;
    if (text.includes('amendment')) return DocumentClassification.AMENDMENT;

    return DocumentClassification.GOVERNMENT_ORDER;
  }
}
