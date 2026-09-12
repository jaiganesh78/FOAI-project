import { Injectable, Logger } from '@nestjs/common';
import { IKnowledgeConnector, FetchedDocumentPayload } from './knowledge-connector.interface';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class PdfConnector implements IKnowledgeConnector {
  private readonly logger = new Logger(PdfConnector.name);

  supports(source: KnowledgeSource): boolean {
    const caps = source.capabilities as Record<string, boolean>;
    return caps?.supportsPdf === true || source.sourceType === 'GAZETTE_PDF';
  }

  async fetchLatestDocuments(source: KnowledgeSource): Promise<FetchedDocumentPayload[]> {
    this.logger.log(`Fetching PDF documents for source ${source.code}`);
    return [
      {
        documentNumber: `${source.code}-PDF-001`,
        title: `${source.name} Official Gazette Notification PDF`,
        rawContent: Buffer.from('%PDF-1.4 Mock Gazette Notification Content for Scheme Guidelines'),
        contentType: 'application/pdf',
        sourceUrl: `${source.baseUrl}/gazette.pdf`,
        publicationDate: new Date(),
      },
    ];
  }
}
