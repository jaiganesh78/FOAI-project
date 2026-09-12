import { Inject, Injectable } from '@nestjs/common';
import { CITIZEN_QUERY_SERVICE, KNOWLEDGE_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
import { IKnowledgeQueryService } from '../../knowledge/services/knowledge-query.service';
import { PolicyDocument } from '@prisma/client';

export interface EvaluationContext {
  userId: string;
  citizenSnapshotId: string;
  citizenFacts: Record<string, unknown>;
  activePolicies: PolicyDocument[];
}

@Injectable()
export class ContextEngineService {
  constructor(
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
    @Inject(KNOWLEDGE_QUERY_SERVICE) private readonly knowledgeQueryService: IKnowledgeQueryService,
  ) {}

  async buildContext(userId: string): Promise<EvaluationContext> {
    const citizenFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    const activePolicies = await this.knowledgeQueryService.getActivePolicies();

    return {
      userId,
      citizenSnapshotId: `snap-${userId}-${Date.now()}`,
      citizenFacts,
      activePolicies,
    };
  }
}
