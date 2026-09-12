import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface AuthoritativeChangePayload {
  triggerType: string;
  triggerEntityId: string;
  triggerEntityVersion: number;
  sourceEventId: string;
  userId: string;
  attributeKey?: string;
  rootEventId: string;
  correlationId: string;
  causationId: string;
  propagationDepth: number;
}

@Injectable()
export class ChangeDetectionService {
  detectFactChange(params: {
    userId: string;
    factId: string;
    attributeKey: string;
    factVersion: number;
    sourceEventId: string;
    rootEventId?: string;
    causationId?: string;
    correlationId?: string;
    propagationDepth?: number;
  }): AuthoritativeChangePayload {
    const rootEventId = params.rootEventId || params.sourceEventId;
    const correlationId = params.correlationId || `corr_${params.sourceEventId}`;
    const causationId = params.causationId || params.sourceEventId;
    const depth = params.propagationDepth || 1;

    return {
      triggerType: 'FACT_CHANGED',
      triggerEntityId: params.factId,
      triggerEntityVersion: params.factVersion,
      sourceEventId: params.sourceEventId,
      userId: params.userId,
      attributeKey: params.attributeKey,
      rootEventId,
      correlationId,
      causationId,
      propagationDepth: depth,
    };
  }

  computeChangeFingerprint(payload: AuthoritativeChangePayload): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }
}
