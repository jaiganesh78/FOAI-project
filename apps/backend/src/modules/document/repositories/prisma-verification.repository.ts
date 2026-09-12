import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IVerificationRepository, VerificationWithDetails } from './verification.repository.interface';
import { VerificationStep, VerificationActor, Prisma } from '@prisma/client';
import { DocumentVerificationStatus, VerificationMethod } from '@gpios/shared';

@Injectable()
export class PrismaVerificationRepository implements IVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createVerification(data: {
    documentId: string;
    userId: string;
    status: DocumentVerificationStatus;
    method: VerificationMethod;
    verifiedBy: string;
    notes?: string;
  }): Promise<VerificationWithDetails> {
    return this.prisma.verification.create({
      data: {
        documentId: data.documentId,
        userId: data.userId,
        status: data.status,
        method: data.method,
        verifiedBy: data.verifiedBy,
        notes: data.notes,
      },
      include: {
        steps: true,
      },
    }) as unknown as VerificationWithDetails;
  }

  async findById(id: string): Promise<VerificationWithDetails | null> {
    return this.prisma.verification.findUnique({
      where: { id },
      include: { steps: true },
    }) as unknown as VerificationWithDetails | null;
  }

  async findByDocumentId(documentId: string): Promise<VerificationWithDetails | null> {
    return this.prisma.verification.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: { steps: true },
    }) as unknown as VerificationWithDetails | null;
  }

  async updateStatus(id: string, status: DocumentVerificationStatus, notes?: string): Promise<VerificationWithDetails> {
    return this.prisma.verification.update({
      where: { id },
      data: {
        status,
        notes,
        verifiedAt: status === DocumentVerificationStatus.VERIFIED ? new Date() : undefined,
      },
      include: { steps: true },
    }) as unknown as VerificationWithDetails;
  }

  async addStep(verificationId: string, stepName: string, actorName: string, status: string, details?: Record<string, unknown>): Promise<VerificationStep> {
    return this.prisma.verificationStep.create({
      data: {
        verificationId,
        stepName,
        actorName,
        status,
        details: (details as Prisma.InputJsonValue) || undefined,
      },
    });
  }

  async findActorByCode(actorCode: string): Promise<VerificationActor | null> {
    return this.prisma.verificationActor.findUnique({
      where: { actorCode },
    });
  }
}
