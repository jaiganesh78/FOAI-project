import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { RuleEvaluationResult } from './rule-engine.service';
import { EligibilityStatus } from '@gpios/shared';

export interface ExplanationOutput {
  humanExplanation: string;
  technicalExplanation: string;
}

@Injectable()
export class ExplainabilityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async generateExplanation(
    status: EligibilityStatus,
    policyTitle: string,
    ruleResults: RuleEvaluationResult[],
    facts: Record<string, unknown>,
  ): Promise<ExplanationOutput> {
    const passedCount = ruleResults.filter((r) => r.isPassed).length;
    const failedCount = ruleResults.length - passedCount;

    let humanExplanation = '';
    let technicalExplanation = `Evaluated ${ruleResults.length} rules (${passedCount} passed, ${failedCount} failed). Status: ${status}.`;

    if (status === EligibilityStatus.ELIGIBLE) {
      const template = await this.prisma.explainabilityTemplate.findUnique({
        where: { code: 'EXPLAIN_ELIGIBLE_FARMER' },
      });

      if (template) {
        humanExplanation = this.interpolate(template.templateText, {
          policy: policyTitle,
          landHolding: String(facts.landHolding || '1.5'),
          threshold: '2.0',
        });
      } else {
        humanExplanation = `Citizen meets all mandatory eligibility criteria for ${policyTitle}.`;
      }
    } else {
      const template = await this.prisma.explainabilityTemplate.findUnique({
        where: { code: 'EXPLAIN_INELIGIBLE_INCOME' },
      });

      if (template) {
        const income = Number(facts.annualIncome || 210000);
        humanExplanation = this.interpolate(template.templateText, {
          policy: policyTitle,
          income: String(income),
          threshold: '200000',
          gapAmount: String(income - 200000),
        });
      } else {
        humanExplanation = `Citizen does not meet one or more mandatory eligibility requirements for ${policyTitle}.`;
      }
    }

    return { humanExplanation, technicalExplanation };
  }

  private interpolate(templateStr: string, vars: Record<string, string>): string {
    return templateStr.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] || '');
  }
}
