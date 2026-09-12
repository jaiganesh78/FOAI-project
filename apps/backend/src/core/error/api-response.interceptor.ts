import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { correlationStorage } from '../logger/correlation.middleware';
import { StandardApiResponse } from '@gpios/shared';

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const correlation = correlationStorage.getStore();
    const requestId = correlation?.requestId || (req.headers['x-request-id'] as string) || 'unknown';

    return next.handle().pipe(
      map((data) => {
        // If response is already formatted (e.g. from custom handler), pass-through
        if (data && typeof data === 'object' && 'success' in data && 'requestId' in data) {
          return data;
        }

        return {
          success: true,
          requestId,
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode || 200,
          message: 'Operation completed successfully.',
          data: data ?? null,
        };
      }),
    );
  }
}
