export enum CanonicalSemanticAttributeCode {
  AGRICULTURE_LAND_AREA = 'AGRICULTURE.LAND_AREA',
  AGRICULTURE_LAND_OWNERSHIP = 'AGRICULTURE.LAND_OWNERSHIP_STATUS',
  FINANCIAL_ANNUAL_INCOME = 'FINANCIAL.ANNUAL_INCOME',
  OCCUPATION_CATEGORY = 'OCCUPATION.CATEGORY',
  DEMOGRAPHICS_DOB = 'DEMOGRAPHICS.DATE_OF_BIRTH',
  DEMOGRAPHICS_GENDER = 'DEMOGRAPHICS.GENDER',
  COMMUNITY_SOCIAL_CATEGORY = 'COMMUNITY.SOCIAL_CATEGORY',
  COMMUNITY_CASTE_CATEGORY = 'COMMUNITY.CASTE_CATEGORY',
  ECONOMIC_EWS_STATUS = 'ECONOMIC.EWS_STATUS',
  IDENTITY_AADHAAR = 'IDENTITY.AADHAAR_NUMBER',
  IDENTITY_BANK_ACCOUNT = 'IDENTITY.BANK_ACCOUNT_NUMBER',
  DISABILITY_STATUS = 'DISABILITY.BENCHMARK_STATUS',
}

export enum SemanticUnit {
  // Area (Universal Base: HECTARE)
  HECTARE = 'HECTARE',
  ACRE = 'ACRE',
  SQ_METER = 'SQ_METER',
  CENT = 'CENT',

  // Regional non-standard units (Jurisdiction required; not universally convertible in V1)
  BIGHA_REGIONAL = 'BIGHA_REGIONAL',

  // Currency (Universal Base: INR)
  INR = 'INR',
  LAKH = 'LAKH',
  CRORE = 'CRORE',
  THOUSAND = 'THOUSAND',
}

export enum CanonicalOccupationCategory {
  CULTIVATOR = 'CULTIVATOR',
  AGRICULTURAL_LABOURER = 'AGRICULTURAL_LABOURER',
  SALARIED_EMPLOYEE = 'SALARIED_EMPLOYEE',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  STUDENT = 'STUDENT',
  UNEMPLOYED = 'UNEMPLOYED',
  RETIRED = 'RETIRED',
}

export enum CanonicalGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  TRANSGENDER = 'TRANSGENDER',
  OTHER = 'OTHER',
}

/**
 * Social / Caste Categories in India (Affirmative Action / Community Identity).
 * NOTE: EWS is an economic criterion (ECONOMIC.EWS_STATUS) and NOT a caste category.
 */
export enum CanonicalSocialCategory {
  GENERAL = 'GENERAL',
  OBC = 'OBC',
  SC = 'SC',
  ST = 'ST',
}

/**
 * Backward compatibility alias for CanonicalSocialCategory.
 * EWS is explicitly excluded.
 */
export enum CanonicalCasteCategory {
  GENERAL = 'GENERAL',
  OBC = 'OBC',
  SC = 'SC',
  ST = 'ST',
}
