import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiResponseInterceptor } from '../src/core/error/api-response.interceptor';
import { AllExceptionsFilter } from '../src/core/error/all-exceptions.filter';
import { USER_REPOSITORY, SESSION_REPOSITORY, AUDIT_REPOSITORY, EVENT_PUBLISHER } from '../src/core/tokens/injection-tokens';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { UserStatus } from '@prisma/client';
import { UserRoleType, PermissionAction } from '@gpios/shared';

describe('Auth & IAM API Flows (E2E Tests)', () => {
  let app: INestApplication;
  let mockUser: any;
  let mockSession: any;

  beforeAll(async () => {
    mockUser = {
      id: 'mock-user-uuid-101',
      email: 'citizen@gpios.gov.in',
      fullName: 'Citizen Demo',
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      failedLoginCount: 0,
      accountLockedUntil: null,
      identities: [
        {
          id: 'identity-1',
          provider: 'LOCAL',
          // argon2id hash for 'Password123!'
          passwordHash: '$argon2id$v=19$m=16384,t=2,p=1$c2FsdHNhbHRzYWx0$g45a+0bK5iX+W/W6P2pY0B3O6+K8W8X7k4L3m2N1oP0',
        },
      ],
      userRoles: [
        {
          role: {
            id: 'role-1',
            name: UserRoleType.CITIZEN,
            rolePermissions: [
              {
                permission: {
                  id: 'perm-1',
                  action: PermissionAction.POLICY_READ,
                },
              },
            ],
          },
        },
      ],
    };

    mockSession = {
      id: 'mock-session-uuid-202',
      userId: mockUser.id,
      tokenHash: 'mock-token-hash',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    const mockUserRepository = {
      findByEmail: async (email: string) => (email === mockUser.email ? mockUser : null),
      findById: async (id: string) => (id === mockUser.id ? mockUser : null),
      resetFailedLogin: async () => mockUser,
      updateLastLogin: async () => mockUser,
      incrementFailedLogin: async () => mockUser,
    };

    const mockSessionRepository = {
      createSession: async () => mockSession,
      findByTokenHash: async () => mockSession,
      findActiveByUserId: async () => [mockSession],
      revokeSession: async () => ({ ...mockSession, isRevoked: true }),
      revokeAllSessionsForUser: async () => 1,
      softDelete: async () => true,
    };

    const mockAuditRepository = {
      logAuthEvent: async () => ({}),
      findByUserId: async () => [],
    };

    const mockEventPublisher = {
      publish: async () => {},
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(mockUserRepository)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(mockSessionRepository)
      .overrideProvider(AUDIT_REPOSITORY)
      .useValue(mockAuditRepository)
      .overrideProvider(EVENT_PUBLISHER)
      .useValue(mockEventPublisher)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    const passwordService = app.get(PasswordService);
    mockUser.identities[0].passwordHash = await passwordService.hash('Password123!');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login - should fail with 401 on invalid user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@gpios.gov.in', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid credentials.');
  });

  it('POST /api/v1/auth/login - should authenticate and return standard envelope with tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'citizen@gpios.gov.in', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('citizen@gpios.gov.in');
    expect(res.body.data.user.roles).toContain(UserRoleType.CITIZEN);
  });

  it('GET /api/v1/auth/me - should return 401 without Bearer token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me - should return user profile with valid Bearer token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'citizen@gpios.gov.in', password: 'Password123!' });

    const accessToken = loginRes.body.data.tokens.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('citizen@gpios.gov.in');
    expect(meRes.body.data.permissions).toContain(PermissionAction.POLICY_READ);
  });

  it('GET /api/v1/auth/sessions - should return user active sessions', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'citizen@gpios.gov.in', password: 'Password123!' });

    const accessToken = loginRes.body.data.tokens.accessToken;

    const sessionsRes = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.success).toBe(true);
    expect(Array.isArray(sessionsRes.body.data)).toBe(true);
  });

  it('DELETE /api/v1/auth/sessions/:id - should revoke specific session', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'citizen@gpios.gov.in', password: 'Password123!' });

    const accessToken = loginRes.body.data.tokens.accessToken;

    const deleteRes = await request(app.getHttpServer())
      .delete('/api/v1/auth/sessions/mock-session-uuid-202')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
