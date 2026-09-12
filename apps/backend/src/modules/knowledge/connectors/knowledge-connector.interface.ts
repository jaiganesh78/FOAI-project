import { KnowledgeSource } from '@prisma/client';

export interface FetchedDocumentPayload {
  documentNumber: string;
  title: string;
  rawContent: string | Buffer;
  contentType: string;
  sourceUrl: string;
  publicationDate?: Date;
}

export interface IKnowledgeConnector {
  supports(source: KnowledgeSource): boolean;
  fetchLatestDocuments(source: KnowledgeSource): Promise<FetchedDocumentPayload[]>;
}
