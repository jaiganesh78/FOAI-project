import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IPolicyDocumentRepository, CreatePolicyDocumentData } from './policy-document.repository.interface';
import { PolicyDocument, PolicyLifecycleStatus } from '@prisma/client';

@Injectable()
export class PrismaPolicyDocumentRepository implements IPolicyDocumentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PolicyDocument | null> {
    return this.prisma.policyDocument.findFirst({ where: { id, deletedAt: null } });
  }

  async findByDocumentNumber(documentNumber: string): Promise<PolicyDocument | null> {
    return this.prisma.policyDocument.findFirst({ where: { documentNumber, deletedAt: null } });
  }

  async findByStatus(status: PolicyLifecycleStatus): Promise<PolicyDocument[]> {
    return this.prisma.policyDocument.findMany({ where: { status, deletedAt: null } });
  }

  async findAll(): Promise<PolicyDocument[]> {
    return this.prisma.policyDocument.findMany({ where: { deletedAt: null } });
  }

  async createDocument(data: CreatePolicyDocumentData): Promise<PolicyDocument> {
    return this.prisma.policyDocument.create({
      data: {
        sourceId: data.sourceId,
        documentNumber: data.documentNumber,
        title: data.title,
        classification: data.classification,
        status: data.status || PolicyLifecycleStatus.DISCOVERED,
      },
    });
  }

  async updateStatus(id: string, status: PolicyLifecycleStatus): Promise<PolicyDocument> {
    return this.prisma.policyDocument.update({
      where: { id },
      data: { status },
    });
  }

  async incrementVersion(id: string): Promise<PolicyDocument> {
    return this.prisma.policyDocument.update({
      where: { id },
      data: { currentVersionNumber: { increment: 1 } },
    });
  }
}
