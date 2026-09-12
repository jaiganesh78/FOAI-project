import { Injectable, Logger } from '@nestjs/common';
import { IKnowledgeConnector, FetchedDocumentPayload } from './knowledge-connector.interface';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class WebScrapingConnector implements IKnowledgeConnector {
  private readonly logger = new Logger(WebScrapingConnector.name);

  supports(source: KnowledgeSource): boolean {
    const caps = source.capabilities as Record<string, boolean>;
    return caps?.supportsHtmlScraping === true || source.sourceType === 'PORTAL';
  }

  async fetchLatestDocuments(source: KnowledgeSource): Promise<FetchedDocumentPayload[]> {
    this.logger.log(`Fetching documents via WebScraping Connector for source ${source.code}`);
    return [
      {
        documentNumber: `${source.code}-SCRAPE-001`,
        title: `${source.name} Guidelines Portal Guidelines`,
        rawContent: `<html><body><h1>${source.name} Guidelines</h1><p>Financial grant of Rs 200000 for eligible beneficiaries in Tamil Nadu.</p></body></html>`,
        contentType: 'text/html',
        sourceUrl: source.baseUrl,
        publicationDate: new Date(),
      },
    ];
  }
}
