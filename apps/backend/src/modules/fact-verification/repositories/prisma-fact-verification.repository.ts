import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IFactVerificationRepository } from './fact-verification.repository.interface';
import {
  FactVerificationPolicy,
  FactVerificationRun,
  FactVerificationResolution,
  FactVerificationReview,
  FactVerificationSnapshot,
  FactVerificationEvent,
  Prisma,
} from '@prisma/client';

@Injectable()
export class PrismaFactVerificationRepository implements IFactVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActivePolicy(attributeKey: string): Promise<FactVerificationPolicy | null> {
    return this.prisma.factVerificationPolicy.findFirst({
      where: { attributeKey, isActive: true },
      orderBy: { version: 'desc' },
    });
  }

  async findPolicyByVersion(attributeKey: string, version: number): Promise<FactVerificationPolicy | null> {
    return this.prisma.factVerificationPolicy.findUnique({
      where: { attributeKey_version: { attributeKey, version } },
    });
  }

  async findVerificationRunByIdempotencyKey(userId: string, idempotencyKey: string): Promise<FactVerificationRun | null> {
    return this.prisma.factVerificationRun.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  async createVerificationRun(data: {
    userId: string;
    factId: string;
    attributeKey: string;
    policyId: string;
    policyVersion: number;
    policyConfiguration: unknown;
    policyChecksumSha256: string;
    idempotencyKey: string;
    status: string;
  }): Promise<FactVerificationRun> {
    return this.prisma.factVerificationRun.create({
      data: {
        userId: data.userId,
        factId: data.factId,
        attributeKey: data.attributeKey,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        policyConfiguration: data.policyConfiguration as Prisma.InputJsonValue,
        policyChecksumSha256: data.policyChecksumSha256,
        idempotencyKey: data.idempotencyKey,
        status: data.status,
      },
    });
  }

  async createResolution(data: {
    verificationRunId: string;
    factId: string;
    attributeKey: string;
    winningValue: unknown;
    winningSource: string;
    winningSourcePrecedence: number;
    losingValues: unknown;
    strategy: string;
    resolutionReason: string;
    policyId: string;
    policyVersion: number;
    policyChecksumSha256: string;
    resolvedBy: string;
  }): Promise<FactVerificationResolution> {
    return this.prisma.factVerificationResolution.create({
      data: {
        verificationRunId: data.verificationRunId,
        factId: data.factId,
        attributeKey: data.attributeKey,
        winningValue: data.winningValue as Prisma.InputJsonValue,
        winningSource: data.winningSource,
        winningSourcePrecedence: data.winningSourcePrecedence,
        losingValues: data.losingValues as Prisma.InputJsonValue,
        strategy: data.strategy,
        resolutionReason: data.resolutionReason,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        policyChecksumSha256: data.policyChecksumSha256,
        resolvedBy: data.resolvedBy,
      },
    });
  }

  async createReview(data: {
    conflictId: string;
    citizenId: string;
    attributeKey: string;
    priority: number;
    reason: string;
    requiredEvidenceTypes: unknown;
    slaDeadline: Date;
  }): Promise<FactVerificationReview> {
    return this.prisma.factVerificationReview.create({
      data: {
        conflictId: data.conflictId,
        citizenId: data.citizenId,
        attributeKey: data.attributeKey,
        priority: data.priority,
        reason: data.reason,
        requiredEvidenceTypes: data.requiredEvidenceTypes as Prisma.InputJsonValue,
        slaDeadline: data.slaDeadline,
        status: 'PENDING',
      },
    });
  }

  async findReviewById(reviewId: string): Promise<FactVerificationReview | null> {
    return this.prisma.factVerificationReview.findUnique({
      where: { id: reviewId },
    });
  }

  async findReviewsByCitizenId(citizenId: string): Promise<FactVerificationReview[]> {
    return this.prisma.factVerificationReview.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReview(reviewId: string, data: {
    assignedReviewerId?: string;
    status?: string;
    reviewerDecision?: string;
    expectedVersion?: number;
  }): Promise<FactVerificationReview> {
    const existing = await this.prisma.factVerificationReview.findUnique({
      where: { id: reviewId },
    });
    if (!existing) throw new ConflictException(`Review '${reviewId}' not found.`);

    if (data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
      throw new ConflictException(
        `Optimistic concurrency conflict on review '${reviewId}'. Expected version ${data.expectedVersion}, but current is ${existing.version}.`,
      );
    }

    return this.prisma.factVerificationReview.update({
      where: { id: reviewId },
      data: {
        assignedReviewerId: data.assignedReviewerId !== undefined ? data.assignedReviewerId : existing.assignedReviewerId,
        status: data.status !== undefined ? data.status : existing.status,
        reviewerDecision: data.reviewerDecision !== undefined ? data.reviewerDecision : existing.reviewerDecision,
        version: existing.version + 1,
      },
    });
  }

  async createSnapshot(data: {
    verificationRunId: string;
    citizenId: string;
    factId: string;
    canonicalValue: unknown;
    canonicalSource: string;
    freshnessStatus: string;
    policyId: string;
    policyVersion: number;
    policyConfiguration: unknown;
    policyChecksumSha256: string;
    checksumSha256: string;
  }): Promise<FactVerificationSnapshot> {
    return this.prisma.factVerificationSnapshot.create({
      data: {
        verificationRunId: data.verificationRunId,
        citizenId: data.citizenId,
        factId: data.factId,
        canonicalValue: data.canonicalValue as Prisma.InputJsonValue,
        canonicalSource: data.canonicalSource,
        freshnessStatus: data.freshnessStatus,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        policyConfiguration: data.policyConfiguration as Prisma.InputJsonValue,
        policyChecksumSha256: data.policyChecksumSha256,
        checksumSha256: data.checksumSha256,
      },
    });
  }

  async getSnapshotByRun(verificationRunId: string): Promise<FactVerificationSnapshot | null> {
    return this.prisma.factVerificationSnapshot.findFirst({
      where: { verificationRunId },
    });
  }

  async getRunById(runId: string): Promise<FactVerificationRun | null> {
    return this.prisma.factVerificationRun.findUnique({
      where: { id: runId },
    });
  }

  async createOutboxEvent(data: {
    eventId: string;
    eventType: string;
    eventVersion?: string;
    aggregateId: string;
    userId: string;
    correlationId?: string;
    causationId?: string;
    payload: unknown;
  }): Promise<FactVerificationEvent> {
    return this.prisma.factVerificationEvent.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        eventVersion: data.eventVersion || '1.0',
        aggregateId: data.aggregateId,
        userId: data.userId,
        correlationId: data.correlationId,
        causationId: data.causationId,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
  }
}
