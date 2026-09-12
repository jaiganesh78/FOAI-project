import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IEvidenceRepository, CreateEvidenceData } from './evidence.repository.interface';
import { FactEvidence, Prisma, VerificationStatus } from '@prisma/client';

@Injectable()
export class PrismaEvidenceRepository implements IEvidenceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FactEvidence | null> {
    return this.prisma.factEvidence.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async createEvidence(data: CreateEvidenceData): Promise<FactEvidence> {
    return this.prisma.factEvidence.create({
      data: {
        documentType: data.documentType,
        issuingAuthority: data.issuingAuthority || null,
        issueDate: data.issueDate || null,
        expiryDate: data.expiryDate || null,
        verificationStatus: data.verificationStatus || VerificationStatus.UNVERIFIED,
        storageRef: data.storageRef || null,
        checksum: data.checksum || null,
        metadata: (data.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });
  }
}
