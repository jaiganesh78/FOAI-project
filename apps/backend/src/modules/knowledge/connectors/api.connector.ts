import { Injectable, Logger } from '@nestjs/common';
import { IKnowledgeConnector, FetchedDocumentPayload } from './knowledge-connector.interface';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class ApiConnector implements IKnowledgeConnector {
  private readonly logger = new Logger(ApiConnector.name);

  supports(source: KnowledgeSource): boolean {
    const caps = source.capabilities as Record<string, boolean>;
    return caps?.supportsApi === true || source.sourceType === 'API';
  }

  async fetchLatestDocuments(source: KnowledgeSource): Promise<FetchedDocumentPayload[]> {
    this.logger.log(`Fetching documents via API Connector for source ${source.code}`);
    return [
      {
        documentNumber: `${source.code}-DOC-001`,
        title: `${source.name} Official Scheme Directive`,
        rawContent: `{"scheme": "${source.name}", "benefit": "Financial assistance of Rs. 6000 per year", "category": "AGRICULTURE", "state": "ALL"}`,
        contentType: 'application/json',
        sourceUrl: `${source.baseUrl}/api/v1/scheme`,
        publicationDate: new Date(),
      },
    ];
  }
}
