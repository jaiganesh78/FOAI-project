import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { TokenService } from '../src/modules/auth/services/token.service';
import {
  ONBOARDING_SESSION_REPOSITORY,
  DISCOVERY_BLUEPRINT_REPOSITORY,
  QUESTION_CATALOG_REPOSITORY,
  CITIZEN_QUERY_SERVICE,
  EVENT_PUBLISHER,
  ONBOARDING_ANALYTICS_SERVICE,
} from '../src/core/tokens/injection-tokens';
import { CitizenFactService } from '../src/modules/citizen/services/citizen-fact.service';
import { UserRoleType, PermissionAction, OnboardingSessionStatus, QuestionInputType } from '@gpios/shared';

describe('OnboardingController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockBlueprint = {
    id: 'bp-1',
    code: 'DEFAULT_CITIZEN',
    name: 'Default Citizen Onboarding Discovery',
    targetPersona: 'ALL',
    categories: ['PERSONAL'],
    stepOrdering: [
      { stepKey: 'personal_info', title: 'Personal Information', category: 'PERSONAL', displayOrder: 1 },
    ],
    version: 1,
    isActive: true,
  };

  const mockSession = {
    id: 'session-uuid-101',
    userId: 'test-user-101',
    blueprintId: 'bp-1',
    blueprintVersion: 1,
    currentStep: 'personal_info',
    completedSteps: [],
    skippedSteps: [],
    completionPercentage: 0.0,
    status: OnboardingSessionStatus.STARTED,
    version: 1,
    lastActivityAt: new Date(),
    completedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    blueprint: mockBlueprint,
  };

  const mockQuestion = {
    id: 'q-1',
    questionCode: 'Q_FULL_NAME',
    attributeKey: 'fullName',
    label: 'What is your Full Name?',
    inputType: QuestionInputType.TEXT,
    displayGroup: 'personal_info',
    displayOrder: 1,
    variant: 'DEFAULT',
    isActive: true,
    attribute: {
      key: 'fullName',
      displayName: 'Full Name',
      category: 'PERSONAL',
      dataType: 'TEXT',
      isMandatory: true,
      parentKey: null,
      activationCondition: null,
      validationRules: null,
    },
  };

  beforeAll(async () => {
    const mockSessionRepo = {
      findByUserId: async () => mockSession,
      findById: async () => mockSession,
      createSession: async () => mockSession,
      updateSession: async () => mockSession,
      logTimelineEvent: async () => {},
      softDelete: async () => true,
    };

    const mockBlueprintRepo = {
      findByCode: async () => mockBlueprint,
      findById: async () => mockBlueprint,
      findAllActive: async () => [mockBlueprint],
    };

    const mockCatalogRepo = {
      findByQuestionCode: async () => mockQuestion,
      findByAttributeKey: async () => mockQuestion,
      findByDisplayGroup: async () => [mockQuestion],
      findAllActive: async () => [mockQuestion],
    };

    const mockCitizenQuery = {
      getStructuredFactsByUserId: async () => ({}),
      getFactValue: async () => null,
      getCategoryFacts: async () => [],
      getCompletenessSummary: async () => ({}),
    };

    const mockFactService = {
      addFactForUser: async () => ({ id: 'fact-1', attributeKey: 'fullName' }),
    };

    const mockAnalytics = {
      trackQuestionAnswered: async () => {},
      trackValidationFailure: async () => {},
    };

    const mockEventPublisher = { publish: async () => {} };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ONBOARDING_SESSION_REPOSITORY)
      .useValue(mockSessionRepo)
      .overrideProvider(DISCOVERY_BLUEPRINT_REPOSITORY)
      .useValue(mockBlueprintRepo)
      .overrideProvider(QUESTION_CATALOG_REPOSITORY)
      .useValue(mockCatalogRepo)
      .overrideProvider(CITIZEN_QUERY_SERVICE)
      .useValue(mockCitizenQuery)
      .overrideProvider(CitizenFactService)
      .useValue(mockFactService)
      .overrideProvider(ONBOARDING_ANALYTICS_SERVICE)
      .useValue(mockAnalytics)
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
      'test-user-101',
      'onboarding.tester@gpios.gov.in',
      [UserRoleType.CITIZEN],
      [PermissionAction.POLICY_READ],
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/onboarding/session - should return session for citizen', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/onboarding/session')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe('test-user-101');
    expect(res.body.data.blueprintCode).toBe('DEFAULT_CITIZEN');
  });

  it('GET /api/v1/onboarding/questions - should return step questions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/onboarding/questions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stepKey).toBe('personal_info');
    expect(res.body.data.questions.length).toBe(1);
  });

  it('POST /api/v1/onboarding/answers - should process answer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/onboarding/answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionKey: 'Q_FULL_NAME',
        rawInput: 'Discovery Tester',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/onboarding/progress - should return completion progress', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/onboarding/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSteps).toBe(1);
  });
});
