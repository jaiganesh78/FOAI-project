import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { EvaluationMetricsDto } from '@gpios/shared';

@Injectable()
export class EvaluationMetricsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordMetrics(params: {
    userId: string;
    executionDurationMs: number;
    graphDepth: number;
    executedRuleCount: number;
    skippedRuleCount: number;
    dependencyTraversalCount: number;
    cacheHit: boolean;
    replayExecutionTimeMs?: number;
    incrementalEvaluationSavingsMs?: number;
  }): Promise<void> {
    await this.prisma.evaluationMetricsRecord.create({
      data: {
        userId: params.userId,
        executionDurationMs: params.executionDurationMs,
        graphDepth: params.graphDepth,
        executedRuleCount: params.executedRuleCount,
        skippedRuleCount: params.skippedRuleCount,
        dependencyTraversalCount: params.dependencyTraversalCount,
        cacheHit: params.cacheHit,
        replayExecutionTimeMs: params.replayExecutionTimeMs,
        incrementalEvaluationSavingsMs: params.incrementalEvaluationSavingsMs,
      },
    });
  }

  async getLatestMetrics(userId: string): Promise<EvaluationMetricsDto> {
    const record = await this.prisma.evaluationMetricsRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        executionDurationMs: 0,
        graphDepth: 1,
        executedRuleCount: 0,
        skippedRuleCount: 0,
        dependencyTraversalCount: 0,
        cacheHit: false,
      };
    }

    return {
      executionDurationMs: record.executionDurationMs,
      graphDepth: record.graphDepth,
      executedRuleCount: record.executedRuleCount,
      skippedRuleCount: record.skippedRuleCount,
      dependencyTraversalCount: record.dependencyTraversalCount,
      cacheHit: record.cacheHit,
      replayExecutionTimeMs: record.replayExecutionTimeMs,
      incrementalEvaluationSavingsMs: record.incrementalEvaluationSavingsMs,
    };
  }
}
