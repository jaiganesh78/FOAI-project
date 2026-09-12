import { Inject, Injectable } from '@nestjs/common';
import { CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ICitizenAttributeRegistryRepository } from '../repositories/citizen-attribute-registry.repository.interface';
import { CitizenFactWithAttribute } from '../repositories/citizen-fact.repository.interface';
import { ProfileStatus, ProfileCompletenessResponseDto } from '@gpios/shared';

@Injectable()
export class CitizenCompletenessEngine {
  constructor(
    @Inject(CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY)
    private readonly attributeRegistryRepository: ICitizenAttributeRegistryRepository,
  ) {}

  async calculateCompleteness(
    profileId: string,
    activeFacts: CitizenFactWithAttribute[],
  ): Promise<{ status: ProfileStatus; completenessDto: ProfileCompletenessResponseDto }> {
    const allAttributes = await this.attributeRegistryRepository.findAllActive();
    const mandatoryAttributes = allAttributes.filter((a) => a.isMandatory);

    const factKeySet = new Set(activeFacts.map((f) => f.attributeKey));
    const missingMandatory = mandatoryAttributes.filter((a) => !factKeySet.has(a.key));

    const totalMandatoryCount = mandatoryAttributes.length;
    const completedMandatoryCount = totalMandatoryCount - missingMandatory.length;

    const completionPercentage =
      totalMandatoryCount > 0 ? Number(((completedMandatoryCount / totalMandatoryCount) * 100).toFixed(2)) : 100.0;

    // Categories Breakdown
    const categoryMap = new Map<string, { total: number; filled: number }>();
    for (const attr of allAttributes) {
      const cat = attr.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { total: 0, filled: 0 });
      }
      const entry = categoryMap.get(cat)!;
      entry.total += 1;
      if (factKeySet.has(attr.key)) {
        entry.filled += 1;
      }
    }

    const missingCategories: string[] = [];
    let completedCategoriesCount = 0;
    categoryMap.forEach((stats, cat) => {
      if (stats.filled === 0) {
        missingCategories.push(cat);
      }
      if (stats.filled > 0 && stats.filled === stats.total) {
        completedCategoriesCount += 1;
      }
    });

    // Profile Lifecycle State Transition Logic
    let status: ProfileStatus = ProfileStatus.CREATED;
    if (activeFacts.length > 0) {
      if (completionPercentage === 100.0) {
        status = ProfileStatus.COMPLETED;
      } else if (completionPercentage >= 50.0) {
        status = ProfileStatus.PARTIALLY_COMPLETED;
      } else {
        status = ProfileStatus.IN_PROGRESS;
      }
    }

    const completenessDto: ProfileCompletenessResponseDto = {
      profileId,
      completionPercentage,
      status,
      totalCategories: categoryMap.size,
      completedCategories: completedCategoriesCount,
      missingCategories,
      missingMandatoryAttributes: missingMandatory.map((a) => ({
        key: a.key,
        displayName: a.displayName,
        category: a.category,
      })),
    };

    return { status, completenessDto };
  }
}
