import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IPolicyRuleRepository, PolicyRuleWithVersion } from './policy-rule.repository.interface';

@Injectable()
export class PrismaPolicyRuleRepository implements IPolicyRuleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PolicyRuleWithVersion | null> {
    return this.prisma.policyRule.findUnique({
      where: { id },
      include: {
        versions: {
          where: { isCurrent: true },
          include: {
            groups: {
              include: {
                conditions: true,
                childGroups: { include: { conditions: true } },
              },
            },
          },
        },
      },
    }) as Promise<PolicyRuleWithVersion | null>;
  }

  async findByRuleCode(ruleCode: string): Promise<PolicyRuleWithVersion | null> {
    return this.prisma.policyRule.findUnique({
      where: { ruleCode },
      include: {
        versions: {
          where: { isCurrent: true },
          include: {
            groups: {
              include: {
                conditions: true,
                childGroups: { include: { conditions: true } },
              },
            },
          },
        },
      },
    }) as Promise<PolicyRuleWithVersion | null>;
  }

  async findActiveRulesByPolicyVersionId(policyVersionId: string): Promise<PolicyRuleWithVersion[]> {
    return this.prisma.policyRule.findMany({
      where: { policyVersionId, isActive: true },
      include: {
        versions: {
          where: { isCurrent: true },
          include: {
            groups: {
              include: {
                conditions: true,
                childGroups: { include: { conditions: true } },
              },
            },
          },
        },
      },
    }) as Promise<PolicyRuleWithVersion[]>;
  }

  async findAllActiveRules(): Promise<PolicyRuleWithVersion[]> {
    return this.prisma.policyRule.findMany({
      where: { isActive: true },
      include: {
        versions: {
          where: { isCurrent: true },
          include: {
            groups: {
              include: {
                conditions: true,
                childGroups: { include: { conditions: true } },
              },
            },
          },
        },
      },
    }) as Promise<PolicyRuleWithVersion[]>;
  }
}
