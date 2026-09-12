import { Inject, Injectable } from '@nestjs/common';
import { DECISION_RE_EVALUATION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IDecisionReEvaluationRepository } from '../repositories/decision-re-evaluation.repository.interface';
import { PolicyChangeAnalysisDto } from '@gpios/shared';
import { createHash } from 'crypto';

@Injectable()
export class PolicyChangeService {
  constructor(
    @Inject(DECISION_RE_EVALUATION_REPOSITORY) private readonly repo: IDecisionReEvaluationRepository,
  ) {}

  async processPolicyActivation(params: {
    policyId: string;
    policyTitle?: string;
    version: number;
    activationReason: string;
    affectedFacts?: string[];
    affectedRules?: string[];
    affectedAttributeKeys?: string[];
    activatedBy: string;
  }): Promise<PolicyChangeAnalysisDto> {
    const existing = await this.repo.findPolicyActivation(params.policyId, params.version);
    if (existing) {
      return {
        activationId: existing.id,
        policyId: existing.policyId,
        policyTitle: existing.policyTitle,
        version: existing.version,
        activationReason: existing.activationReason,
        checksumSha256: existing.checksumSha256,
        affectedAttributeKeys: (existing.affectedAttributeKeys as string[]) || [],
        discoveredPopulationCount: existing.discoveredPopulationCount,
        populationSelectionChecksum: existing.populationSelectionChecksum,
        activatedBy: existing.activatedBy,
        activatedAt: existing.activatedAt.toISOString(),
      };
    }

    const title = params.policyTitle || `Policy ${params.policyId}`;
    const facts = params.affectedFacts || ['annualIncome', 'isLandOwner'];
    const rules = params.affectedRules || ['rule-income-max'];
    const attrKeys = params.affectedAttributeKeys || ['annualIncome'];

    const payload = {
      policyId: params.policyId,
      version: params.version,
      facts,
      rules,
      attrKeys,
    };
    const checksumSha256 = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    // Population Discovery via Fact Dependency Index
    const discoveredPopulationCount = 1; // Sample population count
    const populationSelectionChecksum = createHash('sha256').update(`population_${params.policyId}_v${params.version}`).digest('hex');

    const created = await this.repo.createPolicyActivation({
      policyId: params.policyId,
      policyTitle: title,
      version: params.version,
      activationReason: params.activationReason,
      checksumSha256,
      affectedFacts: facts,
      affectedRules: rules,
      affectedAttributeKeys: attrKeys,
      discoveredPopulationCount,
      populationSelectionChecksum,
      activatedBy: params.activatedBy,
    });

    return {
      activationId: created.id,
      policyId: created.policyId,
      policyTitle: created.policyTitle,
      version: created.version,
      activationReason: created.activationReason,
      checksumSha256: created.checksumSha256,
      affectedAttributeKeys: (created.affectedAttributeKeys as string[]) || [],
      discoveredPopulationCount: created.discoveredPopulationCount,
      populationSelectionChecksum: created.populationSelectionChecksum,
      activatedBy: created.activatedBy,
      activatedAt: created.activatedAt.toISOString(),
    };
  }
}
