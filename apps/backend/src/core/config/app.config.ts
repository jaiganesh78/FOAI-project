import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const appConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'testing', 'staging', 'production']).default('development'),
  port: z.coerce.number().default(3001),
  appName: z.string().default('GPIOS-Backend'),
  appVersion: z.string().default('1.0.0'),
  apiPrefix: z.string().default('api/v1'),
  corsOrigin: z.string().default('http://localhost:3000'),
});

export type AppConfigType = z.infer<typeof appConfigSchema>;

export const appConfig = registerAs('app', (): AppConfigType => {
  return appConfigSchema.parse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    appName: process.env.APP_NAME,
    appVersion: process.env.APP_VERSION,
    apiPrefix: process.env.API_PREFIX,
    corsOrigin: process.env.CORS_ORIGIN,
  });
});
