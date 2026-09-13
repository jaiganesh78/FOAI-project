export interface StandardApiResponse<T = unknown> {
  success: boolean;
  requestId: string;
  timestamp: string;
  statusCode: number;
  message: string;
  data?: T;
  metadata?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ComponentHealthStatus {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export * from './semantic.interface';
export * from './candidate-retrieval.interface';
