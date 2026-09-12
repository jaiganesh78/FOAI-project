import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { FACT_VERIFICATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IFactVerificationRepository } from '../repositories/fact-verification.repository.interface';
import { FactVerificationReviewDto, ManualReviewStatus } from '@gpios/shared';

@Injectable()
export class FactVerificationReviewService {
  constructor(
    @Inject(FACT_VERIFICATION_REPOSITORY) private readonly repo: IFactVerificationRepository,
  ) {}

  async createReview(data: {
    conflictId: string;
    citizenId: string;
    attributeKey: string;
    priority?: number;
    reason: string;
    requiredEvidenceTypes?: string[];
  }): Promise<FactVerificationReviewDto> {
    const slaDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h SLA
    const review = await this.repo.createReview({
      conflictId: data.conflictId,
      citizenId: data.citizenId,
      attributeKey: data.attributeKey,
      priority: data.priority || 100,
      reason: data.reason,
      requiredEvidenceTypes: data.requiredEvidenceTypes || ['DOCUMENT'],
      slaDeadline,
    });

    return {
      reviewId: review.id,
      conflictId: review.conflictId,
      citizenId: review.citizenId,
      attributeKey: review.attributeKey,
      priority: review.priority,
      reason: review.reason,
      requiredEvidenceTypes: (review.requiredEvidenceTypes as string[]) || [],
      assignedReviewerId: review.assignedReviewerId || undefined,
      status: review.status as ManualReviewStatus,
      slaDeadline: review.slaDeadline.toISOString(),
      reviewerDecision: review.reviewerDecision || undefined,
    };
  }

  async assignReview(reviewId: string, officerId: string, actorRoles: string[]): Promise<FactVerificationReviewDto> {
    if (!actorRoles.includes('GOVERNMENT_OFFICER') && !actorRoles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Citizens cannot perform manual review assignments.');
    }

    const updated = await this.repo.updateReview(reviewId, {
      assignedReviewerId: officerId,
      status: 'ASSIGNED',
    });

    return {
      reviewId: updated.id,
      conflictId: updated.conflictId,
      citizenId: updated.citizenId,
      attributeKey: updated.attributeKey,
      priority: updated.priority,
      reason: updated.reason,
      requiredEvidenceTypes: (updated.requiredEvidenceTypes as string[]) || [],
      assignedReviewerId: updated.assignedReviewerId || undefined,
      status: updated.status as ManualReviewStatus,
      slaDeadline: updated.slaDeadline.toISOString(),
      reviewerDecision: updated.reviewerDecision || undefined,
    };
  }

  async completeReview(reviewId: string, decision: 'APPROVED' | 'REJECTED', reason: string, actorRoles: string[]): Promise<FactVerificationReviewDto> {
    if (!actorRoles.includes('GOVERNMENT_OFFICER') && !actorRoles.includes('ADMIN')) {
      throw new ForbiddenException('Security Boundary Rejection: Citizens cannot complete officer manual reviews.');
    }

    const updated = await this.repo.updateReview(reviewId, {
      status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      reviewerDecision: `${decision}: ${reason}`,
    });

    return {
      reviewId: updated.id,
      conflictId: updated.conflictId,
      citizenId: updated.citizenId,
      attributeKey: updated.attributeKey,
      priority: updated.priority,
      reason: updated.reason,
      requiredEvidenceTypes: (updated.requiredEvidenceTypes as string[]) || [],
      assignedReviewerId: updated.assignedReviewerId || undefined,
      status: updated.status as ManualReviewStatus,
      slaDeadline: updated.slaDeadline.toISOString(),
      reviewerDecision: updated.reviewerDecision || undefined,
    };
  }

  async listReviewsForCitizen(citizenId: string): Promise<FactVerificationReviewDto[]> {
    const reviews = await this.repo.findReviewsByCitizenId(citizenId);
    return reviews.map((r) => ({
      reviewId: r.id,
      conflictId: r.conflictId,
      citizenId: r.citizenId,
      attributeKey: r.attributeKey,
      priority: r.priority,
      reason: r.reason,
      requiredEvidenceTypes: (r.requiredEvidenceTypes as string[]) || [],
      assignedReviewerId: r.assignedReviewerId || undefined,
      status: r.status as ManualReviewStatus,
      slaDeadline: r.slaDeadline.toISOString(),
      reviewerDecision: r.reviewerDecision || undefined,
    }));
  }
}
