import { describe, it, expect } from 'vitest';
import { DocumentProcessingPipeline } from '../../../src/modules/knowledge/services/document-processing.pipeline';
import { PolicyFingerprintService } from '../../../src/modules/knowledge/services/policy-fingerprint.service';
import { MetadataExtractionService } from '../../../src/modules/knowledge/services/metadata-extraction.service';
import { PolicyNormalizationService } from '../../../src/modules/knowledge/services/policy-normalization.service';
import { ChunkGenerationService } from '../../../src/modules/knowledge/services/chunk-generation.service';
import { KnowledgeQualityService } from '../../../src/modules/knowledge/services/knowledge-quality.service';
import { KnowledgeIntegrityVerificationService } from '../../../src/modules/knowledge/services/knowledge-integrity.service';
import { DocumentClassificationEngine } from '../../../src/modules/knowledge/services/document-classification.engine';
import { ConnectorFactory } from '../../../src/modules/knowledge/connectors/connector.factory';
import { ApiConnector } from '../../../src/modules/knowledge/connectors/api.connector';
import { WebScrapingConnector } from '../../../src/modules/knowledge/connectors/web-scraping.connector';
import { PdfConnector } from '../../../src/modules/knowledge/connectors/pdf.connector';
import { ManualUploadConnector } from '../../../src/modules/knowledge/connectors/manual-upload.connector';
import { ParserRegistry } from '../../../src/modules/knowledge/parsers/parser.registry';
import { PdfParser } from '../../../src/modules/knowledge/parsers/pdf.parser';
import { HtmlParser } from '../../../src/modules/knowledge/parsers/html.parser';
import { JsonParser } from '../../../src/modules/knowledge/parsers/json.parser';
import { XmlParser } from '../../../src/modules/knowledge/parsers/xml.parser';
import { PlainTextParser } from '../../../src/modules/knowledge/parsers/plain-text.parser';
import { KnowledgeSourceType, CrawlStrategy } from '@gpios/shared';

describe('DocumentProcessingPipeline (Integration)', () => {
  const mockDocRepo = {
    findByDocumentNumber: async () => null,
    createDocument: async (d: any) => ({ id: 'doc-1', documentNumber: d.documentNumber, currentVersionNumber: 1 }),
    incrementVersion: async () => {},
    updateStatus: async () => {},
  };

  const mockVersionRepo = {
    findByFingerprint: async () => null,
    createVersion: async (v: any) => ({ id: 'ver-1', documentId: v.documentId, versionNumber: v.versionNumber }),
  };

  const mockChunkRepo = {
    createChunk: async (c: any) => ({ id: 'chunk-1', ...c }),
  };

  const mockEventPublisher = { publish: async () => {} };
  const mockClock = { now: () => new Date() };

  const pipeline = new DocumentProcessingPipeline(
    mockDocRepo as any,
    mockVersionRepo as any,
    mockChunkRepo as any,
    new PolicyFingerprintService(),
    new MetadataExtractionService(),
    new PolicyNormalizationService(),
    new ChunkGenerationService(),
    new KnowledgeQualityService(),
    new KnowledgeIntegrityVerificationService(),
    new DocumentClassificationEngine(),
    new ConnectorFactory(new ApiConnector(), new WebScrapingConnector(), new PdfConnector(), new ManualUploadConnector()),
    new ParserRegistry(new PdfParser(), new HtmlParser(), new JsonParser(), new XmlParser(), new PlainTextParser()),
    mockEventPublisher as any,
    mockClock as any,
  );

  it('should process source through complete 10-stage ingestion pipeline', async () => {
    const mockSource = {
      id: 'source-101',
      code: 'PM_KISAN',
      name: 'Pradhan Mantri Kisan Samman Nidhi Portal',
      sourceType: KnowledgeSourceType.PORTAL,
      baseUrl: 'https://pmkisan.gov.in',
      crawlStrategy: CrawlStrategy.CRON_SCHEDULE,
      updateFrequencyCron: '0 0 1 * *',
      capabilities: { supportsDownload: true, supportsHtmlScraping: true },
      healthStatus: 'HEALTHY',
      priority: 1,
      isActive: true,
    };

    const metrics = await pipeline.processSource(mockSource as any);

    expect(metrics.skippedDuplicate).toBe(false);
    expect(metrics.chunksCount).toBeGreaterThan(0);
    expect(metrics.processingDurationMs).toBeGreaterThanOrEqual(0);
  });
});
