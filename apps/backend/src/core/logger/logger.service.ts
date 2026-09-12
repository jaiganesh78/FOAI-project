import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { correlationStorage } from './correlation.middleware';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly pinoLogger: pino.Logger;

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    this.pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'debug',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
    });
  }

  log(message: string, context?: string) {
    const ctx = correlationStorage.getStore();
    this.pinoLogger.info({ context, requestId: ctx?.requestId, traceId: ctx?.traceId }, message);
  }

  error(message: string, trace?: string, context?: string) {
    const ctx = correlationStorage.getStore();
    this.pinoLogger.error({ context, trace, requestId: ctx?.requestId, traceId: ctx?.traceId }, message);
  }

  warn(message: string, context?: string) {
    const ctx = correlationStorage.getStore();
    this.pinoLogger.warn({ context, requestId: ctx?.requestId, traceId: ctx?.traceId }, message);
  }

  debug(message: string, context?: string) {
    const ctx = correlationStorage.getStore();
    this.pinoLogger.debug({ context, requestId: ctx?.requestId, traceId: ctx?.traceId }, message);
  }

  verbose(message: string, context?: string) {
    const ctx = correlationStorage.getStore();
    this.pinoLogger.trace({ context, requestId: ctx?.requestId, traceId: ctx?.traceId }, message);
  }
}
