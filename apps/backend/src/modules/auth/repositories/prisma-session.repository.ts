import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ISessionRepository, CreateSessionData } from './session.repository.interface';
import { RefreshSession } from '@prisma/client';

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createSession(data: CreateSessionData): Promise<RefreshSession> {
    return this.prisma.refreshSession.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceName: data.deviceName,
        platform: data.platform,
        browser: data.browser,
        operatingSystem: data.operatingSystem,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    return this.prisma.refreshSession.findFirst({
      where: { tokenHash, deletedAt: null },
    });
  }

  async findActiveByUserId(userId: string): Promise<RefreshSession[]> {
    return this.prisma.refreshSession.findMany({
      where: {
        userId,
        isRevoked: false,
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(sessionId: string, replacedByTokenId?: string): Promise<RefreshSession> {
    return this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        replacedByTokenId: replacedByTokenId || undefined,
      },
    });
  }

  async revokeAllSessionsForUser(userId: string): Promise<number> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return result.count;
  }

  async updateLastActivity(sessionId: string): Promise<RefreshSession> {
    return this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }

  async softDelete(sessionId: string): Promise<boolean> {
    await this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: { deletedAt: new Date(), isRevoked: true },
    });
    return true;
  }
}
