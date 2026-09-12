import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IDecisionTraceRepository, CreateDecisionTraceData, DecisionTraceWithGraph } from './decision-trace.repository.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaDecisionTraceRepository implements IDecisionTraceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<DecisionTraceWithGraph | null> {
    return this.prisma.decisionTrace.findUnique({
      where: { id },
      include: { nodes: true, edges: true },
    }) as Promise<DecisionTraceWithGraph | null>;
  }

  async findByUserId(userId: string): Promise<DecisionTraceWithGraph[]> {
    return this.prisma.decisionTrace.findMany({
      where: { userId },
      include: { nodes: true, edges: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<DecisionTraceWithGraph[]>;
  }

  async createTrace(data: CreateDecisionTraceData): Promise<DecisionTraceWithGraph> {
    return this.prisma.decisionTrace.create({
      data: {
        userId: data.userId,
        citizenSnapshotId: data.citizenSnapshotId,
        policyVersionId: data.policyVersionId,
        policyRuleVersionId: data.policyRuleVersionId,
        status: data.status,
        executionDurationMs: data.executionDurationMs,
        correlationId: data.correlationId,
        evaluatedRulesCount: data.evaluatedRulesCount,
        passedRulesCount: data.passedRulesCount,
        failedRulesCount: data.failedRulesCount,
        skippedRulesCount: data.skippedRulesCount,
        nodes: data.nodes
          ? {
              create: data.nodes.map((n) => ({
                nodeType: n.nodeType,
                label: n.label,
                status: n.status,
                metadata: (n.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              })),
            }
          : undefined,
        edges: data.edges
          ? {
              create: data.edges.map((e) => ({
                sourceNodeId: e.sourceNodeId,
                targetNodeId: e.targetNodeId,
                relationship: e.relationship,
              })),
            }
          : undefined,
      },
      include: { nodes: true, edges: true },
    }) as Promise<DecisionTraceWithGraph>;
  }
}
