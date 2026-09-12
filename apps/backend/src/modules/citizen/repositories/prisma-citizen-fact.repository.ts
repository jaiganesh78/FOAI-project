import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ICitizenFactRepository,
  CreateFactData,
  UpdateFactData,
  CitizenFactWithAttribute,
} from './citizen-fact.repository.interface';
import { CitizenFact, Prisma } from '@prisma/client';

@Injectable()
export class PrismaCitizenFactRepository implements ICitizenFactRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActiveByProfileId(profileId: string): Promise<CitizenFactWithAttribute[]> {
    return (await this.prisma.citizenFact.findMany({
      where: { profileId, isCurrent: true, deletedAt: null },
      include: {
        attribute: true,
      },
      orderBy: { attribute: { displayOrder: 'asc' } },
    })) as CitizenFactWithAttribute[];
  }

  async findByProfileAndKey(profileId: string, attributeKey: string): Promise<CitizenFactWithAttribute | null> {
    return (await this.prisma.citizenFact.findFirst({
      where: { profileId, attributeKey, isCurrent: true, deletedAt: null },
      include: {
        attribute: true,
      },
    })) as CitizenFactWithAttribute | null;
  }

  async findById(id: string): Promise<CitizenFactWithAttribute | null> {
    return (await this.prisma.citizenFact.findFirst({
      where: { id, deletedAt: null },
      include: {
        attribute: true,
      },
    })) as CitizenFactWithAttribute | null;
  }

  async upsertFact(data: CreateFactData): Promise<CitizenFact> {
    const existing = await this.prisma.citizenFact.findFirst({
      where: { profileId: data.profileId, attributeKey: data.attributeKey },
    });

    if (existing) {
      // Archive history of existing fact
      const prevVal = this.extractValue(existing);
      const newVal = {
        text: data.valueText,
        number: data.valueNumber,
        boolean: data.valueBoolean,
        date: data.valueDate,
        json: data.valueJson,
      };

      await this.prisma.citizenFactHistory.create({
        data: {
          factId: existing.id,
          version: existing.version,
          previousValue: prevVal as Prisma.InputJsonValue,
          newValue: newVal as Prisma.InputJsonValue,
          changedBy: data.createdBy,
        },
      });

      return this.prisma.citizenFact.update({
        where: { id: existing.id },
        data: {
          valueText: data.valueText ?? null,
          valueNumber: data.valueNumber ?? null,
          valueBoolean: data.valueBoolean ?? null,
          valueDate: data.valueDate ?? null,
          valueJson: (data.valueJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          confidence: data.confidence ?? existing.confidence,
          confidenceSource: data.confidenceSource ?? existing.confidenceSource,
          verificationStatus: data.verificationStatus ?? existing.verificationStatus,
          creationMethod: data.creationMethod ?? existing.creationMethod,
          createdBy: data.createdBy,
          evidenceId: data.evidenceId ?? existing.evidenceId,
          version: { increment: 1 },
          isCurrent: true,
          deletedAt: null,
        },
      });
    }

    return this.prisma.citizenFact.create({
      data: {
        profileId: data.profileId,
        attributeKey: data.attributeKey,
        valueText: data.valueText ?? null,
        valueNumber: data.valueNumber ?? null,
        valueBoolean: data.valueBoolean ?? null,
        valueDate: data.valueDate ?? null,
        valueJson: (data.valueJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        confidence: data.confidence ?? 1.0,
        confidenceSource: data.confidenceSource,
        confidenceStrategy: data.confidenceStrategy ?? 'DETERMINISTIC',
        verificationStatus: data.verificationStatus,
        creationMethod: data.creationMethod,
        createdBy: data.createdBy,
        evidenceId: data.evidenceId ?? null,
      },
    });
  }

  async updateFact(factId: string, data: UpdateFactData): Promise<CitizenFact> {
    const existing = await this.prisma.citizenFact.findUnique({ where: { id: factId } });
    if (!existing) throw new Error(`Fact ${factId} not found`);

    const prevVal = this.extractValue(existing);
    const newVal = {
      text: data.valueText,
      number: data.valueNumber,
      boolean: data.valueBoolean,
      date: data.valueDate,
      json: data.valueJson,
    };

    await this.prisma.citizenFactHistory.create({
      data: {
        factId: existing.id,
        version: existing.version,
        previousValue: prevVal as Prisma.InputJsonValue,
        newValue: newVal as Prisma.InputJsonValue,
        changeReason: data.changeReason ?? null,
        changedBy: data.changedBy,
      },
    });

    return this.prisma.citizenFact.update({
      where: { id: factId },
      data: {
        valueText: data.valueText !== undefined ? data.valueText : existing.valueText,
        valueNumber: data.valueNumber !== undefined ? data.valueNumber : existing.valueNumber,
        valueBoolean: data.valueBoolean !== undefined ? data.valueBoolean : existing.valueBoolean,
        valueDate: data.valueDate !== undefined ? data.valueDate : existing.valueDate,
        valueJson:
          data.valueJson !== undefined
            ? data.valueJson
              ? (data.valueJson as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : (existing.valueJson as Prisma.InputJsonValue | undefined),
        confidence: data.confidence ?? existing.confidence,
        verificationStatus: data.verificationStatus ?? existing.verificationStatus,
        version: { increment: 1 },
      },
    });
  }

  async softDeleteFact(factId: string): Promise<boolean> {
    await this.prisma.citizenFact.update({
      where: { id: factId },
      data: { isCurrent: false, deletedAt: new Date() },
    });
    return true;
  }

  private extractValue(fact: CitizenFact): unknown {
    return {
      text: fact.valueText,
      number: fact.valueNumber,
      boolean: fact.valueBoolean,
      date: fact.valueDate,
      json: fact.valueJson,
    };
  }
}
