import { LoginHistory } from '@prisma/client';
import { AuditEventType } from '@gpios/shared';

export interface CreateAuditData {
  userId?: string;
  email: string;
  status: AuditEventType | string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  failureReason?: string;
}

export interface IAuditRepository {
  logAuthEvent(data: CreateAuditData): Promise<LoginHistory>;
  findByUserId(userId: string, limit?: number): Promise<LoginHistory[]>;
}
