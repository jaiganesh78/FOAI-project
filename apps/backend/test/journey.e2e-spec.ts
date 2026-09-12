import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { TokenService } from '../src/modules/auth/services/token.service';
import {
  APPLICATION_JOURNEY_ORCHESTRATOR,
  JOURNEY_QUERY_SERVICE,
} from '../src/core/tokens/injection-tokens';
import { UserRoleType, PermissionAction, ApplicationJourneyStatus, JourneyStepStatus, JourneyUrgency } from '@gpios/shared';

describe('ApplicationJourneyController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockJourney: any = {
    id: 'journey-e2e-101',
    userId: 'test-citizen-101',
    policyId: 'pol-pm-kisan-101',
    policyTitle: 'PM Kisan Samman Nidhi',
    blueprintId: 'bp-pm-kisan-v1',
    status: ApplicationJourneyStatus.CREATED,
    urgency: JourneyUrgency.CRITICAL,
    readinessScore: 90,
    steps: [
      {
        id: 'step-e2e-1',
        stepCode: 'VERIFY_AADHAAR',
        title: 'Verify Aadhaar Identity',
        description: 'Verify identity',
        status: JourneyStepStatus.READY,
        order: 1,
        isOptional: false,
        executionPolicy: {
          executionMode: 'MANUAL',
          owner: 'CITIZEN',
          retryLimit: 3,
          retryIntervalMs: 60000,
          blockingBehavior: 'BLOCKING',
          timeoutMs: 86400000,
          requiresVerification: true,
        },
        prerequisiteStepIds: [],
        blockedByStepIds: [],
      },
    ],
    checklist: {
      id: 'chk-101',
      journeyId: 'journey-e2e-101',
      status: 'COMPLETED',
      items: [],
    },
    actionPlan: {
      id: 'ap-101',
      journeyId: 'journey-e2e-101',
      steps: [
        {
          id: 'act-1',
          timeframe: 'TODAY',
          stepTitle: 'Verify Aadhaar Identity',
          instruction: 'Complete Aadhaar verification',
          priority: JourneyUrgency.CRITICAL,
          isCompleted: false,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const mockOrchestrator = {
      generateJourney: async () => mockJourney,
      completeJourneyStep: async () => ({
        ...mockJourney,
        steps: [{ ...mockJourney.steps[0], status: JourneyStepStatus.COMPLETED }],
      }),
    };

    const mockQueryService = {
      getJourneysByUserId: async () => [mockJourney],
      getJourneyById: async () => mockJourney,
      getChecklist: async () => mockJourney.checklist,
      getActionPlan: async () => mockJourney.actionPlan,
      getTimeline: async () => [
        {
          id: 't-1',
          journeyId: 'journey-e2e-101',
          eventType: 'JOURNEY_CREATED',
          description: 'Journey created',
          timestamp: new Date().toISOString(),
        },
      ],
      getProgress: async () => ({ overallPercentage: 50, completedStepsCount: 1, totalStepsCount: 2 }),
      getReadiness: async () => ({
        score: 90,
        citizenFactsPercentage: 100,
        documentsPercentage: 80,
        evidencePercentage: 90,
        verificationPercentage: 90,
        applicationStatusPercentage: 50,
        dependencyPercentage: 100,
        missingItemsCount: 0,
      }),
      getSnapshot: async () => ({
        id: 'snap-e2e-101',
        journeyId: 'journey-e2e-101',
        userId: 'test-citizen-101',
        citizenSnapshotId: 'cs-1',
        eligibilitySnapshotId: 'es-1',
        recommendationSnapshotId: 'rs-1',
        journeyVersion: 1,
        snapshotData: { checksum: 'abc123hash' },
        createdAt: new Date().toISOString(),
      }),
      replayJourney: async () => ({
        journeyId: 'journey-e2e-101',
        snapshotId: 'snap-e2e-101',
        isMatch: true,
        replayType: 'SNAPSHOT',
        executionTimeMs: 3,
        driftDetails: [],
      }),
      getDifferences: async () => [],
      getAnalytics: async () => ({
        averageJourneyDurationMs: 120000,
        averageApprovalDurationMs: 86400000,
        averageStepDurationMs: 300000,
        averageWaitingTimeMs: 600000,
        averageVerificationTimeMs: 1800000,
        longestBlockingStepTitle: 'Land Record Verification',
        deadlineMissRate: 0.05,
        journeyReplayDurationMs: 15,
        snapshotCreationDurationMs: 25,
        blueprintReusePercent: 85.0,
        mostFailedStepTitle: 'Bank Passbook Upload',
        mostRepeatedStepTitle: 'Aadhaar Authentication',
        averageCitizenCompletionPercent: 92.5,
        averageGovernmentProcessingPercent: 88.0,
        dependencyResolutionTimeMs: 12,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APPLICATION_JOURNEY_ORCHESTRATOR)
      .useValue(mockOrchestrator)
      .overrideProvider(JOURNEY_QUERY_SERVICE)
      .useValue(mockQueryService)
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

  it('POST /api/v1/journeys/generate - should generate application journey', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/journeys/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ policyId: '00000000-0000-0000-0000-000000000001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('journey-e2e-101');
  });

  it('GET /api/v1/journeys - should list citizen journeys', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journeys')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/v1/journeys/:id/checklist - should return checklist', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journeys/journey-e2e-101/checklist')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('GET /api/v1/journeys/:id/action-plan - should return personalized action plan', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journeys/journey-e2e-101/action-plan')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.steps[0].timeframe).toBe('TODAY');
  });

  it('POST /api/v1/journeys/:id/step/:stepId/complete - should complete journey step', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/journeys/journey-e2e-101/step/step-e2e-1/complete')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.steps[0].status).toBe(JourneyStepStatus.COMPLETED);
  });

  it('POST /api/v1/journeys/:id/replay - should replay journey snapshot', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/journeys/journey-e2e-101/replay')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMatch).toBe(true);
  });

  it('GET /api/v1/journeys/analytics - should return expanded operational analytics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journeys/analytics')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.blueprintReusePercent).toBe(85.0);
  });

  it('GET /api/v1/journeys/health - should return engine health status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/journeys/health')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
  });
});
