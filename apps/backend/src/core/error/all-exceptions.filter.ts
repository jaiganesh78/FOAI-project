import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { correlationStorage } from '../logger/correlation.middleware';
import { StandardApiResponse } from '@gpios/shared';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlation = correlationStorage.getStore();
    const requestId = correlation?.requestId || (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resPayload = exception.getResponse();
      if (typeof resPayload === 'string') {
        message = resPayload;
      } else if (typeof resPayload === 'object' && resPayload !== null) {
        const objPayload = resPayload as Record<string, unknown>;
        message = (objPayload.message as string) || exception.message;
        errorCode = (objPayload.error as string) || 'HTTP_EXCEPTION';
        details = objPayload.details || objPayload;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
    }

    const payload: StandardApiResponse<null> = {
      success: false,
      requestId,
      timestamp: new Date().toISOString(),
      statusCode: status,
      message,
      data: null,
      error: {
        code: errorCode,
        message,
        details,
      },
    };

    response.status(status).json(payload);
  }
}
