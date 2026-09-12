import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { PasswordService } from '../../../src/modules/auth/services/password.service';
import { ConfigService } from '../../../src/core/config/config.service';

describe('PasswordService (Argon2id Unit Tests)', () => {
  let passwordService: PasswordService;

  beforeAll(() => {
    const mockConfigService = {
      security: {
        argon2MemoryCostKb: 16384, // Reduced for unit test speed
        argon2TimeCost: 2,
        argon2Parallelism: 1,
      },
    } as unknown as ConfigService;

    passwordService = new PasswordService(mockConfigService);
  });

  it('should hash password using Argon2id format', async () => {
    const rawPassword = 'SuperSecurePassword123!';
    const hash = await passwordService.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
  });

  it('should verify correct password match', async () => {
    const rawPassword = 'SuperSecurePassword123!';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const rawPassword = 'SuperSecurePassword123!';
    const wrongPassword = 'WrongPassword999!';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(hash, wrongPassword);
    expect(isValid).toBe(false);
  });
});
