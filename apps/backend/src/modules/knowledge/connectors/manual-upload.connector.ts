import { Injectable, Logger } from '@nestjs/common';
import { IKnowledgeConnector, FetchedDocumentPayload } from './knowledge-connector.interface';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class ManualUploadConnector implements IKnowledgeConnector {
  private readonly logger = new Logger(ManualUploadConnector.name);

  supports(source: KnowledgeSource): boolean {
    return source.crawlStrategy === 'MANUAL_UPLOAD';
  }

  async fetchLatestDocuments(source: KnowledgeSource): Promise<FetchedDocumentPayload[]> {
    this.logger.log(`Fetching manual uploads for source ${source.code}`);
    return [];
  }
}
