import { describe, it, expect } from 'vitest';
import { appConfigSchema } from '../src/core/config/app.config';
import { databaseConfigSchema } from '../src/core/config/database.config';
import { redisConfigSchema } from '../src/core/config/redis.config';

describe('Modular Config Systems Unit Tests', () => {
  it('should validate AppConfig default values correctly', () => {
    const config = appConfigSchema.parse({});
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3001);
    expect(config.appName).toBe('GPIOS-Backend');
  });

  it('should validate DatabaseConfig schema correctly', () => {
    const config = databaseConfigSchema.parse({
      url: 'postgresql://test:test@localhost:5432/test_db',
    });
    expect(config.url).toContain('postgresql://');
  });

  it('should validate RedisConfig schema correctly', () => {
    const config = redisConfigSchema.parse({ host: '127.0.0.1', port: 6379 });
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(6379);
  });
});
