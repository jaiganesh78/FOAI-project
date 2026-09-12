import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IEligibilitySnapshotRepository, CreateEligibilitySnapshotData, EligibilitySnapshotWithDetails } from './eligibility-snapshot.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaEligibilitySnapshotRepository implements IEligibilitySnapshotRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EligibilitySnapshotWithDetails | null> {
    return this.prisma.eligibilitySnapshot.findUnique({
      where: { id },
      include: { results: true, benefitAnalysis: true, opportunityAnalysis: true },
    }) as Promise<EligibilitySnapshotWithDetails | null>;
  }

  async findByUserId(userId: string): Promise<EligibilitySnapshotWithDetails[]> {
    return this.prisma.eligibilitySnapshot.findMany({
      where: { userId },
      include: { results: true, benefitAnalysis: true, opportunityAnalysis: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<EligibilitySnapshotWithDetails[]>;
  }

  async findLatestByUserId(userId: string): Promise<EligibilitySnapshotWithDetails | null> {
    return this.prisma.eligibilitySnapshot.findFirst({
      where: { userId },
      include: { results: true, benefitAnalysis: true, opportunityAnalysis: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<EligibilitySnapshotWithDetails | null>;
  }

  async createSnapshot(data: CreateEligibilitySnapshotData): Promise<EligibilitySnapshotWithDetails> {
    return this.prisma.eligibilitySnapshot.create({
      data: {
        userId: data.userId,
        citizenSnapshotId: data.citizenSnapshotId,
        policyVersionId: data.policyVersionId,
        decisionTraceId: data.decisionTraceId,
        status: data.status,
        resultSummary: (data.resultSummary as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        results: {
          create: data.results.map((r) => ({
            policyId: r.policyId,
            policyVersionId: r.policyVersionId,
            status: r.status,
            passedRules: r.passedRules,
            failedRules: r.failedRules,
            skippedRules: r.skippedRules,
            humanExplanation: r.humanExplanation,
            technicalExplanation: r.technicalExplanation,
          })),
        },
        benefitAnalysis: data.benefitAnalysis
          ? {
              create: {
                totalMonetaryValue: data.benefitAnalysis.totalMonetaryValue,
                recurringMonthlyValue: data.benefitAnalysis.recurringMonthlyValue,
                oneTimeGrantValue: data.benefitAnalysis.oneTimeGrantValue,
                urgencyLevel: data.benefitAnalysis.urgencyLevel,
                applicationDeadline: data.benefitAnalysis.applicationDeadline,
              },
            }
          : undefined,
        opportunityAnalysis: data.opportunityAnalysis
          ? {
              create: {
                gapType: data.opportunityAnalysis.gapType,
                description: data.opportunityAnalysis.description,
                requiredAction: data.opportunityAnalysis.requiredAction,
                potentialBenefitAmount: data.opportunityAnalysis.potentialBenefitAmount,
                gapValue: (data.opportunityAnalysis.gapValue as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              },
            }
          : undefined,
      },
      include: { results: true, benefitAnalysis: true, opportunityAnalysis: true },
    }) as Promise<EligibilitySnapshotWithDetails>;
  }
}
