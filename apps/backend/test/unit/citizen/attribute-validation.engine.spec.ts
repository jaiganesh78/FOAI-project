import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { AttributeValidationEngine } from '../../../src/modules/citizen/services/attribute-validation.engine';
import { ICitizenAttributeRegistryRepository } from '../../../src/modules/citizen/repositories/citizen-attribute-registry.repository.interface';
import { ICitizenFactRepository } from '../../../src/modules/citizen/repositories/citizen-fact.repository.interface';
import { AttributeDataType, FactCategory } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('AttributeValidationEngine (Unit Tests)', () => {
  let validationEngine: AttributeValidationEngine;
  let mockRegistryRepo: ICitizenAttributeRegistryRepository;
  let mockFactRepo: ICitizenFactRepository;

  beforeAll(() => {
    const mockAttributes: Record<string, any> = {
      fullName: {
        key: 'fullName',
        displayName: 'Full Name',
        category: FactCategory.PERSONAL,
        dataType: AttributeDataType.TEXT,
        isMandatory: true,
        validationRules: null,
      },
      annualIncome: {
        key: 'annualIncome',
        displayName: 'Annual Household Income',
        category: FactCategory.FINANCIAL,
        dataType: AttributeDataType.NUMBER,
        isMandatory: true,
        validationRules: { min: 0, max: 100000000 },
      },
      casteCategory: {
        key: 'casteCategory',
        displayName: 'Social Category',
        category: FactCategory.COMMUNITY,
        dataType: AttributeDataType.ENUM,
        isMandatory: true,
        validationRules: { allowedValues: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'] },
      },
      isFarmer: {
        key: 'isFarmer',
        displayName: 'Is Farmer',
        category: FactCategory.AGRICULTURE,
        dataType: AttributeDataType.BOOLEAN,
        isMandatory: false,
      },
      landAreaHectares: {
        key: 'landAreaHectares',
        displayName: 'Land Area',
        category: FactCategory.AGRICULTURE,
        dataType: AttributeDataType.NUMBER,
        isMandatory: false,
        parentKey: 'isFarmer',
        activationCondition: 'true',
        validationRules: { min: 0, max: 500 },
      },
    };

    mockRegistryRepo = {
      findByKey: async (key: string) => mockAttributes[key] || null,
      findAllActive: async () => Object.values(mockAttributes),
      findByCategory: async () => [],
    };

    mockFactRepo = {
      findByProfileAndKey: async (profileId: string, key: string) => {
        if (key === 'isFarmer') {
          return {
            id: 'fact-1',
            profileId,
            attributeKey: 'isFarmer',
            valueBoolean: true,
            isCurrent: true,
            attribute: mockAttributes['isFarmer'],
          } as any;
        }
        return null;
      },
    } as unknown as ICitizenFactRepository;

    validationEngine = new AttributeValidationEngine(mockRegistryRepo);
  });

  it('should format valid text input', async () => {
    const res = await validationEngine.validateAndFormat('fullName', 'John Doe', 'profile-1');
    expect(res.typedValue.valueText).toBe('John Doe');
  });

  it('should validate numeric bounds correctly', async () => {
    const res = await validationEngine.validateAndFormat('annualIncome', 250000, 'profile-1');
    expect(res.typedValue.valueNumber).toBe(250000);

    await expect(validationEngine.validateAndFormat('annualIncome', -50, 'profile-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should validate enum allowed values', async () => {
    const res = await validationEngine.validateAndFormat('casteCategory', 'OBC', 'profile-1');
    expect(res.typedValue.valueText).toBe('OBC');

    await expect(validationEngine.validateAndFormat('casteCategory', 'INVALID_CASTE', 'profile-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should validate parent attribute dependency rules', async () => {
    const res = await validationEngine.validateAndFormat('landAreaHectares', 2.5, 'profile-1', mockFactRepo);
    expect(res.typedValue.valueNumber).toBe(2.5);
  });

  it('should reject non-registered attributes', async () => {
    await expect(validationEngine.validateAndFormat('nonExistentKey', 'value', 'profile-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
