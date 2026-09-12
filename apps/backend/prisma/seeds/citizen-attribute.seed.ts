import { PrismaClient, FactCategory, AttributeDataType } from '@prisma/client';

export async function seedCitizenAttributeRegistry(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding Master Citizen Attribute Registry...');

  const attributes = [
    // 1. Personal & Demographics
    {
      key: 'fullName',
      displayName: 'Full Name',
      category: FactCategory.PERSONAL,
      dataType: AttributeDataType.TEXT,
      isMandatory: true,
      displayOrder: 1,
      uiGroup: 'Personal Information',
    },
    {
      key: 'dob',
      displayName: 'Date of Birth',
      category: FactCategory.DEMOGRAPHICS,
      dataType: AttributeDataType.DATE,
      isMandatory: true,
      displayOrder: 2,
      uiGroup: 'Personal Information',
    },
    {
      key: 'gender',
      displayName: 'Gender',
      category: FactCategory.DEMOGRAPHICS,
      dataType: AttributeDataType.ENUM,
      isMandatory: true,
      validationRules: { allowedValues: ['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER'] },
      displayOrder: 3,
      uiGroup: 'Personal Information',
    },
    {
      key: 'maritalStatus',
      displayName: 'Marital Status',
      category: FactCategory.DEMOGRAPHICS,
      dataType: AttributeDataType.ENUM,
      isMandatory: false,
      validationRules: { allowedValues: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] },
      displayOrder: 4,
      uiGroup: 'Personal Information',
    },

    // 2. Financial & Occupation
    {
      key: 'annualIncome',
      displayName: 'Annual Household Income (INR)',
      category: FactCategory.FINANCIAL,
      dataType: AttributeDataType.NUMBER,
      isMandatory: true,
      validationRules: { min: 0, max: 100000000 },
      displayOrder: 10,
      uiGroup: 'Financial & Occupation',
    },
    {
      key: 'occupationCategory',
      displayName: 'Occupation Category',
      category: FactCategory.OCCUPATION,
      dataType: AttributeDataType.ENUM,
      isMandatory: true,
      validationRules: {
        allowedValues: ['FARMER', 'SALARIED', 'SELF_EMPLOYED', 'STUDENT', 'UNEMPLOYED', 'ARTISAN'],
      },
      displayOrder: 11,
      uiGroup: 'Financial & Occupation',
    },
    {
      key: 'isTaxPayer',
      displayName: 'Income Tax Payer Status',
      category: FactCategory.FINANCIAL,
      dataType: AttributeDataType.BOOLEAN,
      isMandatory: false,
      displayOrder: 12,
      uiGroup: 'Financial & Occupation',
    },

    // 3. Agriculture (Hierarchical Dependency Example: isFarmer -> landArea -> irrigationType)
    {
      key: 'isFarmer',
      displayName: 'Is Practicing Farmer',
      category: FactCategory.AGRICULTURE,
      dataType: AttributeDataType.BOOLEAN,
      isMandatory: false,
      displayOrder: 20,
      uiGroup: 'Agriculture',
    },
    {
      key: 'landAreaHectares',
      displayName: 'Agricultural Land Holding (Hectares)',
      category: FactCategory.AGRICULTURE,
      dataType: AttributeDataType.NUMBER,
      isMandatory: false,
      parentKey: 'isFarmer',
      activationCondition: 'true',
      validationRules: { min: 0, max: 500 },
      displayOrder: 21,
      uiGroup: 'Agriculture',
    },

    // 4. Disability & Community
    {
      key: 'isPersonWithDisability',
      displayName: 'Person with Benchmark Disability (PwD)',
      category: FactCategory.DISABILITY,
      dataType: AttributeDataType.BOOLEAN,
      isMandatory: false,
      displayOrder: 30,
      uiGroup: 'Special Status',
    },
    {
      key: 'casteCategory',
      displayName: 'Social Category / Caste',
      category: FactCategory.COMMUNITY,
      dataType: AttributeDataType.ENUM,
      isMandatory: true,
      validationRules: { allowedValues: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'] },
      displayOrder: 31,
      uiGroup: 'Special Status',
    },

    // 5. Address
    {
      key: 'state',
      displayName: 'State / Union Territory',
      category: FactCategory.ADDRESS,
      dataType: AttributeDataType.TEXT,
      isMandatory: true,
      displayOrder: 40,
      uiGroup: 'Location',
    },
    {
      key: 'district',
      displayName: 'District',
      category: FactCategory.ADDRESS,
      dataType: AttributeDataType.TEXT,
      isMandatory: true,
      displayOrder: 41,
      uiGroup: 'Location',
    },
    {
      key: 'pincode',
      displayName: 'Pincode',
      category: FactCategory.ADDRESS,
      dataType: AttributeDataType.TEXT,
      isMandatory: true,
      validationRules: { regex: '^[1-9][0-9]{5}$' },
      displayOrder: 42,
      uiGroup: 'Location',
    },
  ];

  for (const attr of attributes) {
    await prisma.citizenAttributeRegistry.upsert({
      where: { key: attr.key },
      update: {
        displayName: attr.displayName,
        category: attr.category,
        dataType: attr.dataType,
        isMandatory: attr.isMandatory,
        displayOrder: attr.displayOrder,
        uiGroup: attr.uiGroup,
        parentKey: attr.parentKey || null,
        activationCondition: attr.activationCondition || null,
        validationRules: attr.validationRules || undefined,
      },
      create: {
        key: attr.key,
        displayName: attr.displayName,
        category: attr.category,
        dataType: attr.dataType,
        isMandatory: attr.isMandatory,
        displayOrder: attr.displayOrder,
        uiGroup: attr.uiGroup,
        parentKey: attr.parentKey || null,
        activationCondition: attr.activationCondition || null,
        validationRules: attr.validationRules || undefined,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Master Citizen Attribute Registry seeded successfully.');
}
