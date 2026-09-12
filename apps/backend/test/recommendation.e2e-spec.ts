import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { TokenService } from '../src/modules/auth/services/token.service';
import {
  RECOMMENDATION_GENERATION_SERVICE,
  RECOMMENDATION_QUERY_SERVICE,
  RECOMMENDATION_PREFERENCE_SERVICE,
} from '../src/core/tokens/injection-tokens';
import { UserRoleType, PermissionAction, RecommendationLifecycleStatus, RecommendationStatus } from '@gpios/shared';

describe('RecommendationController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockSnapshot = {
    id: 'snap-uuid-rec-1',
    userId: 'test-citizen-101',
    citizenSnapshotId: 'csnap-101',
    eligibilitySnapshotId: 'esnap-101',
    decisionTraceId: 'trace-101',
    recommendationVersionId: 'rver-101',
    contextId: 'ctx-101',
    portfolio: {
      id: 'port-101',
      userId: 'test-citizen-101',
      snapshotId: 'esnap-101',
      totalMonetaryValue: 6000,
      itemCount: 1,
      items: [
        {
          id: 'item-101',
          policyId: 'pol-1',
          policyNumber: 'PM_KISAN-DOC-001',
          policyTitle: 'PM Kisan Guidelines',
          rank: 1,
          priority: 'CRITICAL',
          utilityScore: 85,
          scoreBreakdown: { benefitScore: 30, finalUtilityScore: 85 },
          readiness: { status: 'READY', completionPercentage: 100 },
          explanation: { primaryReason: 'High utility score' },
          lifecycleStatus: RecommendationLifecycleStatus.RECOMMENDED,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const mockGenerationService = {
      generateRecommendations: async () => mockSnapshot,
    };

    const mockQueryService = {
      getTopRecommendations: async () => [
        {
          id: 'rec-101',
          userId: 'test-citizen-101',
          policyId: 'pol-1',
          rank: 1,
          status: RecommendationStatus.ACTIVE,
          lifecycleStatus: RecommendationLifecycleStatus.RECOMMENDED,
          utilityScore: 85,
          createdAt: new Date().toISOString(),
        },
      ],
      getRecommendationById: async () => ({
        id: 'rec-101',
        userId: 'test-citizen-101',
        policyId: 'pol-1',
        rank: 1,
        status: RecommendationStatus.ACTIVE,
        lifecycleStatus: RecommendationLifecycleStatus.RECOMMENDED,
        utilityScore: 85,
        createdAt: new Date().toISOString(),
      }),
      getRecommendationPortfolio: async () => mockSnapshot.portfolio,
      getRecommendationSnapshots: async () => [mockSnapshot],
      getRecommendationSnapshotById: async () => mockSnapshot,
      getRecommendationExplanation: async () => ({
        policyId: 'pol-1',
        rank: 1,
        primaryReason: 'High overall utility score',
        contributingFactors: ['Verified documents'],
        readinessNotice: 'Ready for application',
      }),
      getApplicationReadiness: async () => ({
        status: 'READY',
        completionPercentage: 100,
        missingFacts: [],
        missingDocuments: [],
      }),
      getRecommendationDifferences: async () => [],
      replayRecommendation: async () => ({
        snapshotId: 'snap-uuid-rec-1',
        originalPortfolioId: 'port-101',
        replayedPortfolioId: 'port-101',
        isMatch: true,
        replayExecutionTimeMs: 2,
      }),
      submitFeedback: async () => ({ id: 'fb-1' }),
      getAnalytics: async () => ({
        averageRankingTimeMs: 12,
        portfolioOptimizationTimeMs: 5,
        explanationGenerationTimeMs: 4,
        snapshotCreationTimeMs: 8,
        recommendationDiffTimeMs: 3,
        averageRecommendationScore: 85.0,
        averageBenefitValue: 6000,
        averageApplicationReadinessPercent: 100.0,
        averagePortfolioSize: 1,
        topRecommendedSchemes: ['PM Kisan Samman Nidhi'],
        recommendationFailureRate: 0.0,
      }),
    };

    const mockPreferenceService = {
      updateUserPreference: async () => ({ id: 'pref-1' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RECOMMENDATION_GENERATION_SERVICE)
      .useValue(mockGenerationService)
      .overrideProvider(RECOMMENDATION_QUERY_SERVICE)
      .useValue(mockQueryService)
      .overrideProvider(RECOMMENDATION_PREFERENCE_SERVICE)
      .useValue(mockPreferenceService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const tokenService = app.get(TokenService);
    accessToken = tokenService.generateAccessToken(
      'test-citizen-101',
      'citizen.tester@gpios.gov.in',
      [UserRoleType.CITIZEN],
      [PermissionAction.POLICY_READ],
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/recommendations/generate - should trigger recommendation generation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/recommendations/generate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.portfolio.itemCount).toBe(1);
  });

  it('GET /api/v1/recommendations - should list top recommendations', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/v1/recommendations/portfolio - should return recommendation portfolio', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations/portfolio')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMonetaryValue).toBe(6000);
  });

  it('GET /api/v1/recommendations/readiness - should return application readiness', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations/readiness')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('READY');
  });

  it('POST /api/v1/recommendations/replay/:id - should replay recommendation snapshot', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/recommendations/replay/snap-uuid-rec-1')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMatch).toBe(true);
  });

  it('GET /api/v1/recommendations/analytics - should return recommendation analytics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations/analytics')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.averageRecommendationScore).toBe(85.0);
  });

  it('GET /api/v1/recommendations/health - should return engine health status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/recommendations/health')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
  });
});
