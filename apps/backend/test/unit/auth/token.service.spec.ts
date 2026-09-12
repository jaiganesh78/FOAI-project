import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../src/core/config/config.service';

describe('TokenService (JWT Access & Refresh Unit Tests)', () => {
  let tokenService: TokenService;

  beforeAll(() => {
    const jwtService = new JwtService({});
    const mockConfigService = {
      security: {
        jwtAccessSecret: 'access_secret_test_key_1234567890',
        jwtAccessExpiration: '15m',
        jwtRefreshSecret: 'refresh_secret_test_key_1234567890',
        jwtRefreshExpiration: '7d',
        jwtIssuer: 'gpios-test-issuer',
        jwtAudience: 'gpios-test-audience',
        jwtClockSkewSeconds: 10,
      },
    } as unknown as ConfigService;

    tokenService = new TokenService(jwtService, mockConfigService);
  });

  it('should generate and verify valid JWT Access Token', () => {
    const userId = 'user-uuid-123';
    const email = 'admin@gpios.gov.in';
    const roles = ['Super Administrator'];
    const permissions = ['policy.read', 'policy.write'];

    const accessToken = tokenService.generateAccessToken(userId, email, roles, permissions);
    expect(accessToken).toBeDefined();

    const payload = tokenService.verifyAccessToken(accessToken);
    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.roles).toContain('Super Administrator');
    expect(payload.permissions).toContain('policy.read');
  });

  it('should generate and verify valid JWT Refresh Token', () => {
    const userId = 'user-uuid-123';
    const sessionId = 'session-uuid-999';

    const refreshToken = tokenService.generateRefreshToken(userId, sessionId);
    expect(refreshToken).toBeDefined();

    const payload = tokenService.verifyRefreshToken(refreshToken);
    expect(payload.sub).toBe(userId);
    expect(payload.sessionId).toBe(sessionId);
  });

  it('should hash refresh token via SHA-256', () => {
    const rawToken = 'sample-refresh-jwt-string';
    const hash1 = tokenService.hashRefreshToken(rawToken);
    const hash2 = tokenService.hashRefreshToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });
});
