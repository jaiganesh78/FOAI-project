import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ICandidateRetrievalRepository,
  StructuredFilterCriteria,
  RawCandidatePolicy,
} from './candidate-retrieval.repository.interface';
import { PolicyLifecycleStatus, DocumentClassification } from '@prisma/client';

@Injectable()
export class PrismaCandidateRetrievalRepository implements ICandidateRetrievalRepository {
  private readonly logger = new Logger(PrismaCandidateRetrievalRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findStructuredCandidates(criteria: StructuredFilterCriteria): Promise<RawCandidatePolicy[]> {
    const limit = criteria.limit || 10;
    this.logger.debug(`Executing structured candidate query with limit=${limit}, state=${criteria.state || 'ANY'}`);

    const documents = await this.prisma.policyDocument.findMany({
      where: {
        status: PolicyLifecycleStatus.ACTIVE,
        deletedAt: null,
        ...(criteria.policyClassification
          ? { classification: criteria.policyClassification as DocumentClassification }
          : {}),
      },
      orderBy: [
        { documentNumber: 'asc' },
        { id: 'asc' },
      ],
      include: {
        versions: {
          where: { isCurrent: true },
          include: {
            chunks: {
              include: { metadata: true },
              orderBy: { chunkIndex: 'asc' },
            },
            policyRules: {
              where: { isActive: true },
              include: {
                versions: {
                  where: { isCurrent: true },
                  include: {
                    groups: {
                      include: {
                        conditions: true,
                        childGroups: {
                          include: {
                            conditions: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: limit * 3, // Bounded fetch with headroom for relevance filtering
    });

    const results: RawCandidatePolicy[] = [];

    for (const doc of documents) {
      const currentVersion = doc.versions[0];
      if (!currentVersion) {
        continue;
      }

      // 1. Extract metadata from chunks
      let policyState: string | null = null;
      let policyDepartment: string | null = null;
      let policyMinistry: string | null = null;
      let policyBeneficiaryCategory: string | null = null;
      const sampleChunkTitles: string[] = [];

      for (const chunk of currentVersion.chunks) {
        if (chunk.sectionTitle && sampleChunkTitles.length < 3) {
          sampleChunkTitles.push(chunk.sectionTitle);
        }
        if (chunk.metadata) {
          if (!policyState && chunk.metadata.state) {
            policyState = chunk.metadata.state;
          }
          if (!policyDepartment && chunk.metadata.department) {
            policyDepartment = chunk.metadata.department;
          }
          if (!policyMinistry && chunk.metadata.ministry) {
            policyMinistry = chunk.metadata.ministry;
          }
          if (!policyBeneficiaryCategory && chunk.metadata.beneficiaryCategory) {
            policyBeneficiaryCategory = chunk.metadata.beneficiaryCategory;
          }
        }
      }

      // 2. Extract referenced canonical/legacy attribute keys from rules
      const referencedAttributesSet = new Set<string>();
      for (const rule of currentVersion.policyRules) {
        for (const ruleVer of rule.versions) {
          for (const group of ruleVer.groups) {
            if (group.conditions) {
              for (const cond of group.conditions) {
                if (cond.attributeKey) {
                  referencedAttributesSet.add(cond.attributeKey);
                }
              }
            }
            if (group.childGroups) {
              for (const child of group.childGroups) {
                if (child.conditions) {
                  for (const cond of child.conditions) {
                    if (cond.attributeKey) {
                      referencedAttributesSet.add(cond.attributeKey);
                    }
                  }
                }
              }
            }
          }
        }
      }

      const referencedAttributes = Array.from(referencedAttributesSet);

      // 3. State filter check: If criteria.state is given, policy must be national (state is null/ALL) or match state
      if (criteria.state && policyState) {
        const normalizedPolicyState = policyState.trim().toLowerCase();
        const normalizedFilterState = criteria.state.trim().toLowerCase();
        if (
          normalizedPolicyState !== 'all' &&
          normalizedPolicyState !== 'national' &&
          normalizedPolicyState !== normalizedFilterState
        ) {
          continue; // Inapplicable state
        }
      }

      // 4. Beneficiary category filter check: if given, must match if policy defines one
      if (criteria.beneficiaryCategory && policyBeneficiaryCategory) {
        const normPolicyCat = policyBeneficiaryCategory.trim().toLowerCase();
        const normFilterCat = criteria.beneficiaryCategory.trim().toLowerCase();
        if (normPolicyCat !== 'all' && normPolicyCat !== normFilterCat) {
          continue;
        }
      }

      // 5. Ministry filter check
      if (criteria.ministry) {
        if (!policyMinistry || policyMinistry.trim().toLowerCase() !== criteria.ministry.trim().toLowerCase()) {
          continue;
        }
      }

      // 6. Department filter check
      if (criteria.department && policyDepartment) {
        if (policyDepartment.trim().toLowerCase() !== criteria.department.trim().toLowerCase()) {
          continue;
        }
      }

      // 7. Relevant attribute overlap check (structured relevance filter, NOT eligibility evaluation)
      if (
        criteria.relevantAttributeCodes &&
        criteria.relevantAttributeCodes.length > 0 &&
        referencedAttributes.length > 0
      ) {
        const hasOverlap = referencedAttributes.some((attr) =>
          criteria.relevantAttributeCodes!.includes(attr),
        );
        if (!hasOverlap) {
          continue; // Policy references specific attributes, but none overlap with known citizen facts
        }
      }

      results.push({
        policyId: doc.id,
        policyVersionId: currentVersion.id,
        policyVersionNumber: currentVersion.versionNumber,
        title: doc.title,
        documentNumber: doc.documentNumber,
        classification: doc.classification,
        sourceId: doc.sourceId,
        state: policyState,
        beneficiaryCategory: policyBeneficiaryCategory,
        ministry: policyMinistry,
        department: policyDepartment,
        referencedAttributes,
        chunkCount: currentVersion.chunks.length,
        sampleChunkTitles,
      });

      if (results.length >= limit) {
        break;
      }
    }

    return results;
  }

  async findCandidatePolicyVersionsByIds(versionIds: string[]): Promise<RawCandidatePolicy[]> {
    if (!versionIds || versionIds.length === 0) {
      return [];
    }

    const versions = await this.prisma.policyVersion.findMany({
      where: {
        id: { in: versionIds },
        isCurrent: true,
        document: {
          status: PolicyLifecycleStatus.ACTIVE,
          deletedAt: null,
        },
      },
      include: {
        document: true,
        chunks: {
          include: { metadata: true },
          orderBy: { chunkIndex: 'asc' },
        },
        policyRules: {
          where: { isActive: true },
          include: {
            versions: {
              where: { isCurrent: true },
              include: {
                groups: {
                  include: {
                    conditions: true,
                    childGroups: {
                      include: {
                        conditions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const results: RawCandidatePolicy[] = [];

    for (const ver of versions) {
      const doc = ver.document;
      if (!doc) {
        continue;
      }

      let policyState: string | null = null;
      let policyDepartment: string | null = null;
      let policyMinistry: string | null = null;
      let policyBeneficiaryCategory: string | null = null;
      const sampleChunkTitles: string[] = [];

      for (const chunk of ver.chunks) {
        if (chunk.sectionTitle && sampleChunkTitles.length < 3) {
          sampleChunkTitles.push(chunk.sectionTitle);
        }
        if (chunk.metadata) {
          if (!policyState && chunk.metadata.state) {
            policyState = chunk.metadata.state;
          }
          if (!policyDepartment && chunk.metadata.department) {
            policyDepartment = chunk.metadata.department;
          }
          if (!policyMinistry && chunk.metadata.ministry) {
            policyMinistry = chunk.metadata.ministry;
          }
          if (!policyBeneficiaryCategory && chunk.metadata.beneficiaryCategory) {
            policyBeneficiaryCategory = chunk.metadata.beneficiaryCategory;
          }
        }
      }

      const referencedAttributesSet = new Set<string>();
      for (const rule of ver.policyRules) {
        for (const ruleVer of rule.versions) {
          for (const group of ruleVer.groups) {
            if (group.conditions) {
              for (const cond of group.conditions) {
                if (cond.attributeKey) {
                  referencedAttributesSet.add(cond.attributeKey);
                }
              }
            }
            if (group.childGroups) {
              for (const child of group.childGroups) {
                if (child.conditions) {
                  for (const cond of child.conditions) {
                    if (cond.attributeKey) {
                      referencedAttributesSet.add(cond.attributeKey);
                    }
                  }
                }
              }
            }
          }
        }
      }

      results.push({
        policyId: doc.id,
        policyVersionId: ver.id,
        policyVersionNumber: ver.versionNumber,
        title: doc.title,
        documentNumber: doc.documentNumber,
        classification: doc.classification,
        sourceId: doc.sourceId,
        state: policyState,
        beneficiaryCategory: policyBeneficiaryCategory,
        ministry: policyMinistry,
        department: policyDepartment,
        referencedAttributes: Array.from(referencedAttributesSet),
        chunkCount: ver.chunks.length,
        sampleChunkTitles,
      });
    }

    return results;
  }
}
