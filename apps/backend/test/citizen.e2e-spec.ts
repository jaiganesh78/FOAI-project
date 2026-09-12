import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import {
  CITIZEN_PROFILE_REPOSITORY,
  CITIZEN_FACT_REPOSITORY,
  CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY,
  PROFILE_VERSION_REPOSITORY,
  EVIDENCE_REPOSITORY,
  EVENT_PUBLISHER,
  USER_REPOSITORY,
} from '../src/core/tokens/injection-tokens';
import { TokenService } from '../src/modules/auth/services/token.service';
import { FactCategory, AttributeDataType, ProfileStatus } from '@prisma/client';
import { UserRoleType, PermissionAction } from '@gpios/shared';

describe('Citizen Intelligence APIs (E2E Tests)', () => {
  let app: INestApplication;
  let accessToken: string;
  let mockProfile: any;
  let mockAttribute: any;
  let mockFact: any;

  beforeAll(async () => {
    mockProfile = {
      id: 'profile-uuid-101',
      userId: 'user-uuid-101',
      status: ProfileStatus.CREATED,
      completionPercentage: 0.0,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      facts: [],
    };

    mockAttribute = {
      id: 'attr-1',
      key: 'fullName',
      displayName: 'Full Name',
      category: FactCategory.PERSONAL,
      dataType: AttributeDataType.TEXT,
      isMandatory: true,
      displayOrder: 1,
      isActive: true,
    };

    mockFact = {
      id: 'fact-uuid-202',
      profileId: mockProfile.id,
      attributeKey: mockAttribute.key,
      valueText: 'John Citizen',
      valueNumber: null,
      valueBoolean: null,
      valueDate: null,
      valueJson: null,
      confidence: 1.0,
      confidenceSource: 'USER',
      verificationStatus: 'SELF_DECLARED',
      creationMethod: 'USER_FORM',
      createdBy: 'user-uuid-101',
      isCurrent: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      attribute: mockAttribute,
    };

    const mockProfileRepo = {
      findByUserId: async (userId: string) => (userId === 'user-uuid-101' ? mockProfile : null),
      findById: async (id: string) => (id === mockProfile.id ? mockProfile : null),
      createProfile: async (userId: string) => ({ ...mockProfile, userId }),
      updateStatusAndCompleteness: async (_id: string, status: ProfileStatus, pct: number) => {
        mockProfile.status = status;
        mockProfile.completionPercentage = pct;
        mockProfile.version += 1;
        return mockProfile;
      },
      softDelete: async () => true,
    };

    const mockFactRepo = {
      findActiveByProfileId: async () => (mockProfile.facts.length > 0 ? [mockFact] : []),
      findByProfileAndKey: async (_pId: string, key: string) => (key === 'fullName' ? mockFact : null),
      findById: async (id: string) => (id === mockFact.id ? mockFact : null),
      upsertFact: async (_data: any) => {
        mockProfile.facts = [mockFact];
        return mockFact;
      },
      updateFact: async () => mockFact,
      softDeleteFact: async () => true,
    };

    const mockRegistryRepo = {
      findByKey: async (key: string) => (key === 'fullName' ? mockAttribute : null),
      findAllActive: async () => [mockAttribute],
      findByCategory: async () => [mockAttribute],
    };

    const mockVersionRepo = {
      createVersionSnapshot: async () => ({}),
      findLatestByProfileId: async () => null,
      findByVersionNumber: async () => null,
    };

    const mockEvidenceRepo = {
      findById: async () => null,
      createEvidence: async () => ({}),
    };

    const mockEventPublisher = { publish: async () => {} };
    const mockUserRepo = { findById: async () => null };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CITIZEN_PROFILE_REPOSITORY)
      .useValue(mockProfileRepo)
      .overrideProvider(CITIZEN_FACT_REPOSITORY)
      .useValue(mockFactRepo)
      .overrideProvider(CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY)
      .useValue(mockRegistryRepo)
      .overrideProvider(PROFILE_VERSION_REPOSITORY)
      .useValue(mockVersionRepo)
      .overrideProvider(EVIDENCE_REPOSITORY)
      .useValue(mockEvidenceRepo)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .overrideProvider(USER_REPOSITORY)
      .useValue(mockUserRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    const tokenService = app.get(TokenService);
    accessToken = tokenService.generateAccessToken('user-uuid-101', 'citizen@gpios.gov.in', [UserRoleType.CITIZEN], [PermissionAction.POLICY_READ]);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/citizen/profile - should return profile summary for authenticated citizen', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/citizen/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe('user-uuid-101');
    expect(res.body.data.status).toBe(ProfileStatus.CREATED);
  });

  it('GET /api/v1/citizen/profile/completeness - should return completeness breakdown', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/citizen/profile/completeness')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.completionPercentage).toBeDefined();
  });

  it('POST /api/v1/citizen/facts - should add a new fact validated against registry', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/citizen/facts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ attributeKey: 'fullName', value: 'John Citizen' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attributeKey).toBe('fullName');
  });

  it('GET /api/v1/citizen/facts - should list active facts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/citizen/facts')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
