import { PrismaClient, QuestionInputType } from '@prisma/client';

export async function seedOnboardingDiscovery(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding Master Discovery Blueprint & Question Catalog...');

  // 1. Create Default Blueprint
  const defaultBlueprint = await prisma.discoveryBlueprint.upsert({
    where: { code: 'DEFAULT_CITIZEN' },
    update: {
      name: 'Default Citizen Onboarding Discovery',
      targetPersona: 'ALL',
      categories: ['PERSONAL', 'DEMOGRAPHICS', 'FINANCIAL', 'OCCUPATION', 'AGRICULTURE', 'COMMUNITY', 'ADDRESS'],
      stepOrdering: [
        { stepKey: 'personal_info', title: 'Personal Information', category: 'PERSONAL', displayOrder: 1 },
        { stepKey: 'financial_info', title: 'Income & Occupation', category: 'FINANCIAL', displayOrder: 2 },
        { stepKey: 'agriculture_info', title: 'Agriculture & Land', category: 'AGRICULTURE', displayOrder: 3 },
        { stepKey: 'community_info', title: 'Social Category', category: 'COMMUNITY', displayOrder: 4 },
        { stepKey: 'location_info', title: 'Address & Location', category: 'ADDRESS', displayOrder: 5 },
      ],
    },
    create: {
      code: 'DEFAULT_CITIZEN',
      name: 'Default Citizen Onboarding Discovery',
      targetPersona: 'ALL',
      categories: ['PERSONAL', 'DEMOGRAPHICS', 'FINANCIAL', 'OCCUPATION', 'AGRICULTURE', 'COMMUNITY', 'ADDRESS'],
      stepOrdering: [
        { stepKey: 'personal_info', title: 'Personal Information', category: 'PERSONAL', displayOrder: 1 },
        { stepKey: 'financial_info', title: 'Income & Occupation', category: 'FINANCIAL', displayOrder: 2 },
        { stepKey: 'agriculture_info', title: 'Agriculture & Land', category: 'AGRICULTURE', displayOrder: 3 },
        { stepKey: 'community_info', title: 'Social Category', category: 'COMMUNITY', displayOrder: 4 },
        { stepKey: 'location_info', title: 'Address & Location', category: 'ADDRESS', displayOrder: 5 },
      ],
    },
  });

  // 2. Create Question Catalog Items mapped to Citizen Attribute Registry keys
  const questionsList = [
    {
      questionCode: 'Q_FULL_NAME',
      attributeKey: 'fullName',
      label: 'What is your Full Name?',
      description: 'Enter your full legal name as per official government identification.',
      placeholder: 'e.g. Ramesh Kumar',
      inputType: QuestionInputType.TEXT,
      displayGroup: 'personal_info',
      displayOrder: 1,
      renderingMetadata: { width: 'full', icon: 'user', keyboardType: 'text', i18nKey: 'onboarding.fullName' },
    },
    {
      questionCode: 'Q_DOB',
      attributeKey: 'dob',
      label: 'What is your Date of Birth?',
      description: 'Used for age-restricted scheme eligibility checks.',
      placeholder: 'YYYY-MM-DD',
      inputType: QuestionInputType.DATE,
      displayGroup: 'personal_info',
      displayOrder: 2,
      renderingMetadata: { width: 'half', icon: 'calendar', keyboardType: 'date', i18nKey: 'onboarding.dob' },
    },
    {
      questionCode: 'Q_GENDER',
      attributeKey: 'gender',
      label: 'Please select your Gender',
      inputType: QuestionInputType.RADIO,
      options: [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Transgender', value: 'TRANSGENDER' },
        { label: 'Other', value: 'OTHER' },
      ],
      displayGroup: 'personal_info',
      displayOrder: 3,
      renderingMetadata: { width: 'half', i18nKey: 'onboarding.gender' },
    },
    {
      questionCode: 'Q_ANNUAL_INCOME',
      attributeKey: 'annualIncome',
      label: 'What is your Annual Household Income (in INR)?',
      helpText: 'Include income from all sources (agriculture, salary, business). You can type e.g. 2.5 Lakhs or 250000.',
      placeholder: 'e.g. 2,50,000',
      inputType: QuestionInputType.NUMBER,
      displayGroup: 'financial_info',
      displayOrder: 1,
      renderingMetadata: { width: 'full', icon: 'indian-rupee', keyboardType: 'decimal', i18nKey: 'onboarding.annualIncome' },
    },
    {
      questionCode: 'Q_OCCUPATION',
      attributeKey: 'occupationCategory',
      label: 'What is your Primary Occupation?',
      inputType: QuestionInputType.SELECT,
      options: [
        { label: 'Farmer / Agriculturalist', value: 'FARMER' },
        { label: 'Salaried Employee', value: 'SALARIED' },
        { label: 'Self Employed / Business', value: 'SELF_EMPLOYED' },
        { label: 'Student', value: 'STUDENT' },
        { label: 'Unemployed', value: 'UNEMPLOYED' },
        { label: 'Artisan / Handicraft Worker', value: 'ARTISAN' },
      ],
      displayGroup: 'financial_info',
      displayOrder: 2,
      renderingMetadata: { width: 'full', i18nKey: 'onboarding.occupationCategory' },
    },
    {
      questionCode: 'Q_IS_FARMER',
      attributeKey: 'isFarmer',
      label: 'Are you a practicing farmer or land owner?',
      inputType: QuestionInputType.BOOLEAN,
      displayGroup: 'agriculture_info',
      displayOrder: 1,
      renderingMetadata: { width: 'full', icon: 'sprout', i18nKey: 'onboarding.isFarmer' },
    },
    {
      questionCode: 'Q_LAND_AREA',
      attributeKey: 'landAreaHectares',
      label: 'How much Agricultural Land do you own (in Hectares)?',
      helpText: 'Only shown if you selected "Yes" to practicing farmer.',
      placeholder: 'e.g. 1.5',
      inputType: QuestionInputType.NUMBER,
      displayGroup: 'agriculture_info',
      displayOrder: 2,
      renderingMetadata: { width: 'full', icon: 'ruler', i18nKey: 'onboarding.landAreaHectares' },
    },
    {
      questionCode: 'Q_CASTE_CATEGORY',
      attributeKey: 'casteCategory',
      label: 'Select your Social Category / Caste',
      inputType: QuestionInputType.SELECT,
      options: [
        { label: 'General', value: 'GENERAL' },
        { label: 'Other Backward Class (OBC)', value: 'OBC' },
        { label: 'Scheduled Caste (SC)', value: 'SC' },
        { label: 'Scheduled Tribe (ST)', value: 'ST' },
        { label: 'Economically Weaker Section (EWS)', value: 'EWS' },
      ],
      displayGroup: 'community_info',
      displayOrder: 1,
      renderingMetadata: { width: 'full', i18nKey: 'onboarding.casteCategory' },
    },
    {
      questionCode: 'Q_STATE',
      attributeKey: 'state',
      label: 'State / Union Territory',
      placeholder: 'e.g. Maharashtra',
      inputType: QuestionInputType.TEXT,
      displayGroup: 'location_info',
      displayOrder: 1,
      renderingMetadata: { width: 'half', icon: 'map-pin', i18nKey: 'onboarding.state' },
    },
    {
      questionCode: 'Q_DISTRICT',
      attributeKey: 'district',
      label: 'District',
      placeholder: 'e.g. Pune',
      inputType: QuestionInputType.TEXT,
      displayGroup: 'location_info',
      displayOrder: 2,
      renderingMetadata: { width: 'half', icon: 'map', i18nKey: 'onboarding.district' },
    },
  ];

  for (const q of questionsList) {
    await prisma.questionCatalog.upsert({
      where: { questionCode: q.questionCode },
      update: {
        attributeKey: q.attributeKey,
        label: q.label,
        description: q.description || null,
        helpText: q.helpText || null,
        placeholder: q.placeholder || null,
        inputType: q.inputType,
        options: q.options || undefined,
        displayGroup: q.displayGroup,
        displayOrder: q.displayOrder,
        renderingMetadata: q.renderingMetadata || undefined,
      },
      create: {
        questionCode: q.questionCode,
        attributeKey: q.attributeKey,
        label: q.label,
        description: q.description || null,
        helpText: q.helpText || null,
        placeholder: q.placeholder || null,
        inputType: q.inputType,
        options: q.options || undefined,
        displayGroup: q.displayGroup,
        displayOrder: q.displayOrder,
        renderingMetadata: q.renderingMetadata || undefined,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Discovery Blueprint '${defaultBlueprint.code}' and Question Catalog seeded successfully.`);
}
