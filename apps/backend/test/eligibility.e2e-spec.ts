import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { TokenService } from '../src/modules/auth/services/token.service';
import {
  ELIGIBILITY_EVALUATION_ORCHESTRATOR,
  ELIGIBILITY_QUERY_SERVICE,
  INCREMENTAL_EVALUATION_SERVICE,
} from '../src/core/tokens/injection-tokens';
import { UserRoleType, PermissionAction, EligibilityStatus } from '@gpios/shared';

describe('EligibilityController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockSnapshot = {
    id: 'snap-uuid-101',
    userId: 'test-citizen-101',
    citizenSnapshotId: 'csnap-101',
    policyVersionId: 'pver-101',
    decisionTraceId: 'trace-101',
    status: EligibilityStatus.ELIGIBLE,
    results: [
      {
        policyId: 'pol-1',
        policyNumber: 'PM_KISAN-DOC-001',
        policyTitle: 'PM Kisan Guidelines',
        status: EligibilityStatus.ELIGIBLE,
        passedRules: ['RULE_PM_KISAN_LAND'],
        failedRules: [],
        skippedRules: [],
        humanExplanation: 'Citizen is eligible for PM Kisan.',
        technicalExplanation: 'Evaluated 1 rules.',
      },
    ],
    benefitAnalysis: {
      id: 'ben-1',
      totalMonetaryValue: 6000,
      recurringMonthlyValue: 500,
      oneTimeGrantValue: 0,
      urgencyLevel: 'HIGH',
      applicationDeadline: new Date().toISOString(),
    },
    opportunityAnalysis: null,
    createdAt: new Date().toISOString(),
  };

  const mockTrace = {
    id: 'trace-101',
    userId: 'test-citizen-101',
    citizenSnapshotId: 'csnap-101',
    policyVersionId: 'pver-101',
    policyRuleVersionId: 'prver-101',
    status: EligibilityStatus.ELIGIBLE,
    executionDurationMs: 12,
    traceVersion: 'v1',
    engineVersion: '1.0.0',
    correlationId: 'corr-101',
    evaluatedRulesCount: 1,
    passedRulesCount: 1,
    failedRulesCount: 0,
    skippedRulesCount: 0,
    createdAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const mockOrchestrator = {
      evaluateEligibility: async () => mockSnapshot,
    };

    const mockQueryService = {
      getLatestSnapshot: async () => mockSnapshot,
      getSnapshotById: async () => mockSnapshot,
      getTraceById: async () => mockTrace,
      replayDecision: async () => ({
        snapshotId: 'snap-uuid-101',
        originalStatus: EligibilityStatus.ELIGIBLE,
        replayedStatus: EligibilityStatus.ELIGIBLE,
        isMatch: true,
        replayTimeMs: 2,
      }),
      getMetrics: async () => ({
        executionDurationMs: 12,
        graphDepth: 2,
        executedRuleCount: 1,
        skippedRuleCount: 0,
        dependencyTraversalCount: 1,
        cacheHit: true,
      }),
    };

    const mockIncrementalService = {
      shouldReEvaluate: async () => ({ shouldEvaluate: false, affectedRules: [] }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ELIGIBILITY_EVALUATION_ORCHESTRATOR)
      .useValue(mockOrchestrator)
      .overrideProvider(ELIGIBILITY_QUERY_SERVICE)
      .useValue(mockQueryService)
      .overrideProvider(INCREMENTAL_EVALUATION_SERVICE)
      .useValue(mockIncrementalService)
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

  it('POST /api/v1/eligibility/evaluate - should trigger eligibility evaluation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/eligibility/evaluate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(EligibilityStatus.ELIGIBLE);
  });

  it('GET /api/v1/eligibility/results - should return latest eligibility snapshot', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/eligibility/results')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(EligibilityStatus.ELIGIBLE);
  });

  it('GET /api/v1/eligibility/decision-traces/:id - should return decision trace', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/eligibility/decision-traces/trace-101')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('trace-101');
  });

  it('POST /api/v1/eligibility/replay/:id - should replay historical decision', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/eligibility/replay/snap-uuid-101')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMatch).toBe(true);
  });

  it('GET /api/v1/eligibility/metrics - should return operational metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/eligibility/metrics')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cacheHit).toBe(true);
  });

  it('GET /api/v1/eligibility/health - should return engine health status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/eligibility/health')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
  });
});
