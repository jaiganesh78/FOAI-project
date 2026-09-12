import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { CitizenCompletenessEngine } from '../../../src/modules/citizen/services/citizen-completeness.engine';
import { ICitizenAttributeRegistryRepository } from '../../../src/modules/citizen/repositories/citizen-attribute-registry.repository.interface';
import { FactCategory, ProfileStatus } from '@prisma/client';

describe('CitizenCompletenessEngine (Unit Tests)', () => {
  let completenessEngine: CitizenCompletenessEngine;

  beforeAll(() => {
    const mockAttributes: any[] = [
      { key: 'fullName', category: FactCategory.PERSONAL, isMandatory: true },
      { key: 'dob', category: FactCategory.DEMOGRAPHICS, isMandatory: true },
      { key: 'annualIncome', category: FactCategory.FINANCIAL, isMandatory: true },
      { key: 'casteCategory', category: FactCategory.COMMUNITY, isMandatory: true },
    ];

    const mockRegistryRepo: ICitizenAttributeRegistryRepository = {
      findAllActive: async () => mockAttributes,
      findByKey: async () => null,
      findByCategory: async () => [],
    };

    completenessEngine = new CitizenCompletenessEngine(mockRegistryRepo);
  });

  it('should calculate 0% completeness and CREATED status for empty profile', async () => {
    const { status, completenessDto } = await completenessEngine.calculateCompleteness('profile-1', []);

    expect(status).toBe(ProfileStatus.CREATED);
    expect(completenessDto.completionPercentage).toBe(0);
    expect(completenessDto.missingMandatoryAttributes).toHaveLength(4);
  });

  it('should calculate partial completeness and IN_PROGRESS status', async () => {
    const activeFacts: any[] = [
      { attributeKey: 'fullName', valueText: 'John Doe', attribute: { category: FactCategory.PERSONAL } },
    ];

    const { status, completenessDto } = await completenessEngine.calculateCompleteness('profile-1', activeFacts);

    expect(status).toBe(ProfileStatus.IN_PROGRESS);
    expect(completenessDto.completionPercentage).toBe(25.0);
    expect(completenessDto.missingMandatoryAttributes).toHaveLength(3);
  });

  it('should calculate 100% completeness and COMPLETED status when all mandatory facts exist', async () => {
    const activeFacts: any[] = [
      { attributeKey: 'fullName', valueText: 'John Doe', attribute: { category: FactCategory.PERSONAL } },
      { attributeKey: 'dob', valueDate: new Date(), attribute: { category: FactCategory.DEMOGRAPHICS } },
      { attributeKey: 'annualIncome', valueNumber: 150000, attribute: { category: FactCategory.FINANCIAL } },
      { attributeKey: 'casteCategory', valueText: 'OBC', attribute: { category: FactCategory.COMMUNITY } },
    ];

    const { status, completenessDto } = await completenessEngine.calculateCompleteness('profile-1', activeFacts);

    expect(status).toBe(ProfileStatus.COMPLETED);
    expect(completenessDto.completionPercentage).toBe(100.0);
    expect(completenessDto.missingMandatoryAttributes).toHaveLength(0);
  });
});
