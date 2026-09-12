import { RefreshSession } from '@prisma/client';

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  platform?: string;
  browser?: string;
  operatingSystem?: string;
}

export interface ISessionRepository {
  createSession(data: CreateSessionData): Promise<RefreshSession>;
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  findActiveByUserId(userId: string): Promise<RefreshSession[]>;
  revokeSession(sessionId: string, replacedByTokenId?: string): Promise<RefreshSession>;
  revokeAllSessionsForUser(userId: string): Promise<number>;
  updateLastActivity(sessionId: string): Promise<RefreshSession>;
  softDelete(sessionId: string): Promise<boolean>;
}
