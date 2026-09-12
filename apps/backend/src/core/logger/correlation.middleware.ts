import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export interface CorrelationContext {
  requestId: string;
  traceId?: string;
}

export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const traceId = (req.headers['x-trace-id'] as string) || requestId;

    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    correlationStorage.run({ requestId, traceId }, () => {
      next();
    });
  }
}
