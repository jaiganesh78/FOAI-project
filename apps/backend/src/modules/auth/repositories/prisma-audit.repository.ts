import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IAuditRepository, CreateAuditData } from './audit.repository.interface';
import { LoginHistory } from '@prisma/client';

@Injectable()
export class PrismaAuditRepository implements IAuditRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async logAuthEvent(data: CreateAuditData): Promise<LoginHistory> {
    return this.prisma.loginHistory.create({
      data: {
        userId: data.userId || null,
        email: data.email,
        status: data.status,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
        failureReason: data.failureReason,
      },
    });
  }

  async findByUserId(userId: string, limit = 20): Promise<LoginHistory[]> {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
