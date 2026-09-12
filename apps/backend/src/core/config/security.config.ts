import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const securityConfigSchema = z.object({
  jwtSecret: z.string().default('super_secret_jwt_key_change_in_production'),
  jwtAccessSecret: z.string().default('super_secret_access_key_change_in_production'),
  jwtAccessExpiration: z.string().default('15m'),
  jwtRefreshSecret: z.string().default('super_secret_refresh_key_change_in_production'),
  jwtRefreshExpiration: z.string().default('7d'),
  jwtIssuer: z.string().default('gpios-auth-service'),
  jwtAudience: z.string().default('gpios-platform'),
  jwtClockSkewSeconds: z.coerce.number().default(10),
  encryptionKey: z.string().default('32_character_key_for_aes_256_enc'),
  maxLoginAttempts: z.coerce.number().default(5),
  accountLockoutDurationMinutes: z.coerce.number().default(15),
  argon2MemoryCostKb: z.coerce.number().default(65536), // 64 MB
  argon2TimeCost: z.coerce.number().default(3),
  argon2Parallelism: z.coerce.number().default(4),
});

export type SecurityConfigType = z.infer<typeof securityConfigSchema>;

export const securityConfig = registerAs('security', (): SecurityConfigType => {
  return securityConfigSchema.parse({
    jwtSecret: process.env.JWT_SECRET,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
    jwtIssuer: process.env.JWT_ISSUER,
    jwtAudience: process.env.JWT_AUDIENCE,
    jwtClockSkewSeconds: process.env.JWT_CLOCK_SKEW_SECONDS,
    encryptionKey: process.env.ENCRYPTION_KEY,
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS,
    accountLockoutDurationMinutes: process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES,
    argon2MemoryCostKb: process.env.ARGON2_MEMORY_COST_KB,
    argon2TimeCost: process.env.ARGON2_TIME_COST,
    argon2Parallelism: process.env.ARGON2_PARALLELISM,
  });
});
