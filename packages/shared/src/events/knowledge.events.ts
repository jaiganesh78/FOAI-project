import { StandardDomainEventEnvelope } from './domain-event.registry';

export interface KnowledgeSourceRegisteredPayload {
  sourceId: string;
  sourceCode: string;
  sourceType: string;
  baseUrl: string;
  priority: number;
}

export interface KnowledgeDocumentProcessedPayload {
  documentId: string;
  documentNumber: string;
  sourceId: string;
  versionNumber: number;
  fingerprintHash: string;
  chunkCount: number;
  lifecycleStatus: string;
}

export interface KnowledgeIngestionCompletedPayload {
  jobId: string;
  sourceId: string;
  processedDurationMs: number;
  documentsProcessedCount: number;
}

export type KnowledgeSourceRegisteredEvent = StandardDomainEventEnvelope<KnowledgeSourceRegisteredPayload>;
export type KnowledgeDocumentProcessedEvent = StandardDomainEventEnvelope<KnowledgeDocumentProcessedPayload>;
export type KnowledgeIngestionCompletedEvent = StandardDomainEventEnvelope<KnowledgeIngestionCompletedPayload>;
