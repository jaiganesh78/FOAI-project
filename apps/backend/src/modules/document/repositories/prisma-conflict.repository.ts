import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IConflictRepository, ConflictWithReconciliations } from './conflict.repository.interface';
import { FactReconciliation, Prisma } from '@prisma/client';
import { ConflictStatus, ConflictResolutionType } from '@gpios/shared';

@Injectable()
export class PrismaConflictRepository implements IConflictRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConflict(data: {
    documentId: string;
    userId: string;
    factKey: string;
    declaredValue: unknown;
    extractedValue: unknown;
  }): Promise<ConflictWithReconciliations> {
    return this.prisma.factConflict.create({
      data: {
        documentId: data.documentId,
        userId: data.userId,
        factKey: data.factKey,
        declaredValue: data.declaredValue as Prisma.InputJsonValue,
        extractedValue: data.extractedValue as Prisma.InputJsonValue,
        status: ConflictStatus.DETECTED,
      },
      include: { reconciliations: true },
    }) as unknown as ConflictWithReconciliations;
  }

  async findById(id: string): Promise<ConflictWithReconciliations | null> {
    return this.prisma.factConflict.findUnique({
      where: { id },
      include: { reconciliations: true },
    }) as unknown as ConflictWithReconciliations | null;
  }

  async findByDocumentId(documentId: string): Promise<ConflictWithReconciliations[]> {
    return this.prisma.factConflict.findMany({
      where: { documentId },
      include: { reconciliations: true },
    }) as unknown as ConflictWithReconciliations[];
  }

  async findByUserId(userId: string): Promise<ConflictWithReconciliations[]> {
    return this.prisma.factConflict.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { reconciliations: true },
    }) as unknown as ConflictWithReconciliations[];
  }

  async updateStatus(id: string, status: ConflictStatus): Promise<ConflictWithReconciliations> {
    return this.prisma.factConflict.update({
      where: { id },
      data: { status },
      include: { reconciliations: true },
    }) as unknown as ConflictWithReconciliations;
  }

  async createReconciliation(data: {
    conflictId: string;
    documentId: string;
    userId: string;
    factKey: string;
    resolutionType: ConflictResolutionType;
    finalValue: unknown;
    reconciledBy: string;
  }): Promise<FactReconciliation> {
    return this.prisma.factReconciliation.create({
      data: {
        conflictId: data.conflictId,
        documentId: data.documentId,
        userId: data.userId,
        factKey: data.factKey,
        resolutionType: data.resolutionType,
        finalValue: data.finalValue as Prisma.InputJsonValue,
        reconciledBy: data.reconciledBy,
      },
    });
  }
}
