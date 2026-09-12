import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { TokenService } from '../src/modules/auth/services/token.service';
import {
  KNOWLEDGE_SOURCE_REPOSITORY,
  POLICY_DOCUMENT_REPOSITORY,
  POLICY_VERSION_REPOSITORY,
  POLICY_CHUNK_REPOSITORY,
  INGESTION_JOB_REPOSITORY,
  DOCUMENT_PROCESSING_PIPELINE,
  EVENT_PUBLISHER,
} from '../src/core/tokens/injection-tokens';
import { UserRoleType, PermissionAction, KnowledgeSourceType, CrawlStrategy, PolicyLifecycleStatus, DocumentClassification } from '@gpios/shared';

describe('KnowledgeController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockSource = {
    id: 'src-uuid-101',
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDoc = {
    id: 'doc-uuid-101',
    sourceId: 'src-uuid-101',
    documentNumber: 'PM_KISAN-DOC-001',
    title: 'PM Kisan Guidelines',
    classification: DocumentClassification.SCHEME,
    status: PolicyLifecycleStatus.ACTIVE,
    currentVersionNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVersion = {
    id: 'ver-uuid-101',
    documentId: 'doc-uuid-101',
    versionNumber: 1,
    fingerprintHash: 'hash123',
    rawContentUrl: 'https://pmkisan.gov.in',
    isCurrent: true,
    createdAt: new Date(),
  };

  const mockChunk = {
    id: 'chunk-uuid-101',
    documentId: 'doc-uuid-101',
    versionId: 'ver-uuid-101',
    stableChunkId: 'stable-123',
    chunkIndex: 0,
    sectionTitle: 'Main Body',
    pageNumber: 1,
    paragraphIndex: 1,
    content: 'PM Kisan Financial grant text',
    checksum: 'md5hash',
    createdAt: new Date(),
  };

  const mockJob = {
    id: 'job-uuid-101',
    sourceId: 'src-uuid-101',
    status: 'COMPLETED',
    stage: 'COMPLETED',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    const mockSourceRepo = {
      findById: async () => mockSource,
      findByCode: async () => mockSource,
      findAllActive: async () => [mockSource],
      createSource: async () => mockSource,
      updateSource: async () => mockSource,
      updateHealthStatus: async () => {},
      softDelete: async () => true,
    };

    const mockDocRepo = {
      findById: async () => mockDoc,
      findByDocumentNumber: async () => mockDoc,
      findByStatus: async () => [mockDoc],
      findAll: async () => [mockDoc],
      createDocument: async () => mockDoc,
      updateStatus: async () => mockDoc,
      incrementVersion: async () => mockDoc,
    };

    const mockVersionRepo = {
      findById: async () => mockVersion,
      findByFingerprint: async () => null,
      findByDocumentId: async () => [mockVersion],
      findLatestByDocumentId: async () => mockVersion,
      createVersion: async () => mockVersion,
      markSuperseded: async () => {},
    };

    const mockChunkRepo = {
      findById: async () => mockChunk,
      findByVersionId: async () => [mockChunk],
      findByStableChunkId: async () => mockChunk,
      findAll: async () => [mockChunk],
      createChunk: async () => mockChunk,
      countTotalChunks: async () => 1,
    };

    const mockJobRepo = {
      findById: async () => mockJob,
      findAll: async () => [mockJob],
      createJob: async () => mockJob,
      updateStage: async () => {},
      completeJob: async () => mockJob,
      failJob: async () => mockJob,
    };

    const mockPipeline = {
      processSource: async () => ({
        processingDurationMs: 10,
        parsingDurationMs: 2,
        normalizationDurationMs: 2,
        chunkGenerationDurationMs: 2,
        storageDurationMs: 4,
        chunksCount: 1,
        skippedDuplicate: false,
      }),
    };

    const mockEventPublisher = { publish: async () => {} };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KNOWLEDGE_SOURCE_REPOSITORY)
      .useValue(mockSourceRepo)
      .overrideProvider(POLICY_DOCUMENT_REPOSITORY)
      .useValue(mockDocRepo)
      .overrideProvider(POLICY_VERSION_REPOSITORY)
      .useValue(mockVersionRepo)
      .overrideProvider(POLICY_CHUNK_REPOSITORY)
      .useValue(mockChunkRepo)
      .overrideProvider(INGESTION_JOB_REPOSITORY)
      .useValue(mockJobRepo)
      .overrideProvider(DOCUMENT_PROCESSING_PIPELINE)
      .useValue(mockPipeline)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const tokenService = app.get(TokenService);
    accessToken = tokenService.generateAccessToken(
      'knowledge-admin-101',
      'knowledge.admin@gpios.gov.in',
      [UserRoleType.ADMINISTRATOR],
      [PermissionAction.POLICY_READ, PermissionAction.POLICY_CREATE],
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/knowledge/sources - should return active knowledge sources', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/knowledge/sources')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].code).toBe('PM_KISAN');
  });

  it('POST /api/v1/knowledge/sources - should register new knowledge source', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/knowledge/sources')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'PM_KISAN',
        name: 'Pradhan Mantri Kisan Samman Nidhi Portal',
        baseUrl: 'https://pmkisan.gov.in',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/knowledge/sources/:id/refresh - should trigger refresh job', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/knowledge/sources/src-uuid-101/refresh')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('GET /api/v1/knowledge/documents - should return active documents', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/knowledge/documents')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/v1/knowledge/stats - should return knowledge statistics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/knowledge/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSources).toBe(1);
    expect(res.body.data.activePolicies).toBe(1);
  });

  it('GET /api/v1/knowledge/health - should return source health dashboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/knowledge/health')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
  });
});
