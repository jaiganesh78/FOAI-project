import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const redisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().default(6379),
  password: z.string().optional(),
});

export type RedisConfigType = z.infer<typeof redisConfigSchema>;

export const redisConfig = registerAs('redis', (): RedisConfigType => {
  return redisConfigSchema.parse({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });
});
