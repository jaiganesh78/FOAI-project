import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const monitoringConfigSchema = z.object({
  sentryDsn: z.string().optional(),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('debug'),
});

export type MonitoringConfigType = z.infer<typeof monitoringConfigSchema>;

export const monitoringConfig = registerAs('monitoring', (): MonitoringConfigType => {
  return monitoringConfigSchema.parse({
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL,
  });
});
