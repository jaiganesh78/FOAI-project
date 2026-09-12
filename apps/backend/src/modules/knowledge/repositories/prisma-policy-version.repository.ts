import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IPolicyVersionRepository, CreatePolicyVersionData } from './policy-version.repository.interface';
import { PolicyVersion } from '@prisma/client';

@Injectable()
export class PrismaPolicyVersionRepository implements IPolicyVersionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PolicyVersion | null> {
    return this.prisma.policyVersion.findUnique({ where: { id } });
  }

  async findByFingerprint(hash: string): Promise<PolicyVersion | null> {
    return this.prisma.policyVersion.findUnique({ where: { fingerprintHash: hash } });
  }

  async findByDocumentId(documentId: string): Promise<PolicyVersion[]> {
    return this.prisma.policyVersion.findMany({ where: { documentId }, orderBy: { versionNumber: 'desc' } });
  }

  async findLatestByDocumentId(documentId: string): Promise<PolicyVersion | null> {
    return this.prisma.policyVersion.findFirst({ where: { documentId, isCurrent: true } });
  }

  async createVersion(data: CreatePolicyVersionData): Promise<PolicyVersion> {
    // Unset current status on older versions for same document
    await this.prisma.policyVersion.updateMany({
      where: { documentId: data.documentId },
      data: { isCurrent: false },
    });

    return this.prisma.policyVersion.create({
      data: {
        documentId: data.documentId,
        versionNumber: data.versionNumber,
        fingerprintHash: data.fingerprintHash,
        rawContentUrl: data.rawContentUrl,
        effectiveDate: data.effectiveDate,
        expiryDate: data.expiryDate,
        isCurrent: true,
      },
    });
  }

  async markSuperseded(versionId: string, supersededByVersionId: string): Promise<void> {
    await this.prisma.policyVersion.update({
      where: { id: versionId },
      data: { isCurrent: false, supersededByVersionId },
    });
  }
}
