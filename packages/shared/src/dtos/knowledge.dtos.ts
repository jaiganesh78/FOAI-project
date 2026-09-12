import {
  PolicyLifecycleStatus,
  KnowledgeSourceType,
  CrawlStrategy,
  DocumentClassification,
  EmbeddingStatus,
} from '../enums/knowledge.enum';

export interface SourceCapabilitiesDto {
  supportsDownload: boolean;
  supportsApi: boolean;
  supportsHtmlScraping: boolean;
  supportsPdf: boolean;
  supportsIncrementalSync: boolean;
  supportsVersionDetection: boolean;
  supportsAuthentication: boolean;
}

export interface KnowledgeSourceDto {
  id: string;
  code: string;
  name: string;
  sourceType: KnowledgeSourceType;
  baseUrl: string;
  crawlStrategy: CrawlStrategy;
  updateFrequencyCron: string;
  capabilities: SourceCapabilitiesDto;
  healthStatus: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateKnowledgeSourceInputDto {
  code: string;
  name: string;
  sourceType?: KnowledgeSourceType;
  baseUrl: string;
  crawlStrategy?: CrawlStrategy;
  updateFrequencyCron?: string;
  capabilities?: Partial<SourceCapabilitiesDto>;
  priority?: number;
}

export interface PolicyDocumentDto {
  id: string;
  sourceId: string;
  documentNumber: string;
  title: string;
  classification: DocumentClassification;
  status: PolicyLifecycleStatus;
  currentVersionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersionDto {
  id: string;
  documentId: string;
  versionNumber: number;
  fingerprintHash: string;
  rawContentUrl?: string | null;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface PolicyChunkDto {
  id: string;
  documentId: string;
  versionId: string;
  stableChunkId: string;
  chunkIndex: number;
  sectionTitle?: string | null;
  pageNumber?: number | null;
  paragraphIndex?: number | null;
  content: string;
  checksum: string;
  metadata?: {
    ministry?: string | null;
    department?: string | null;
    schemeName?: string | null;
    state?: string | null;
    district?: string | null;
    beneficiaryCategory?: string | null;
    normalizedAmount?: number | null;
    extractionConfidence: number;
  } | null;
  embeddingPrep?: {
    status: EmbeddingStatus;
    embeddingVersion: string;
    modelIdentifier: string;
  } | null;
}

export interface KnowledgeStatisticsDto {
  totalSources: number;
  activeSources: number;
  totalDocuments: number;
  activePolicies: number;
  archivedPolicies: number;
  totalVersions: number;
  totalChunks: number;
  averageChunkSize: number;
  ingestionSuccessRate: number;
}

export interface KnowledgeHealthDto {
  status: string;
  totalJobsRun: number;
  activeSourcesCount: number;
  healthySourcesCount: number;
  failedIngestions24h: number;
  sources: {
    sourceId: string;
    sourceCode: string;
    healthStatus: string;
    lastCrawlAt?: string | null;
  }[];
}
