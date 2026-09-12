import {
  FactFreshnessStatus,
  FactSourcePrecedence,
  QuestionInputType,
  PrioritizationTieBreakerReason,
} from '../enums';

export interface FactFreshnessDto {
  attributeKey: string;
  freshnessStatus: FactFreshnessStatus;
  expiryDate: string;
  policyVersion: number;
  evaluatedAt: string;
}

export interface CitizenFactDto {
  id: string;
  profileId: string;
  attributeKey: string;
  value: unknown;
  normalizedValue: unknown;
  source: string;
  sourcePrecedence: FactSourcePrecedence;
  confidence: number;
  verificationStatus: string;
  evidenceId?: string;
  freshnessStatus: FactFreshnessStatus;
  freshnessExpiryDate?: string;
  freshnessPolicyVersion: number;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenFactVersionDto {
  id: string;
  factId: string;
  version: number;
  previousValue: unknown;
  newValue: unknown;
  source: string;
  provenance: Record<string, unknown>;
  verificationStatus: string;
  freshnessPolicyVersion: number;
  changeReason?: string;
  changedBy: string;
  correlationId?: string;
  createdAt: string;
}

export interface FactProvenanceDto {
  id: string;
  factId: string;
  sourceType: string;
  sourceReferenceId?: string;
  documentId?: string;
  evidenceId?: string;
  actorId?: string;
  verificationMethod?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ProfileCompletenessBreakdownDto {
  overallCompletenessPercentage: number;
  criticalEligibilityCompletenessPercentage: number;
  recommendationCompletenessPercentage: number;
  applicationReadinessCompletenessPercentage: number;
  missingMandatoryAttributeKeys: string[];
  missingEligibilityAttributeKeys: string[];
  completenessConfigurationVersion: number;
  calculatedAt: string;
}

export interface QuestionOptionDto {
  id: string;
  optionCode: string;
  label: string;
  value: unknown;
  displayOrder: number;
  metadata?: Record<string, unknown>;
}

export interface QuestionDependencyDto {
  id: string;
  dependentQuestionId: string;
  parentQuestionId: string;
  parentAttributeKey: string;
  operator: 'AND' | 'OR' | 'NOT' | 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL' | 'IN' | 'NOT_IN';
  expectedValue: unknown;
}

export interface OnboardingQuestionDto {
  id: string;
  questionCode: string;
  version: number;
  attributeKey: string;
  questionText: string;
  helpText?: string;
  inputType: QuestionInputType;
  isRequired: boolean;
  options: QuestionOptionDto[];
  dependencies: QuestionDependencyDto[];
  priority: number;
  displayOrder: number;
  explanationTemplate: string;
  isActive: boolean;
}

export interface DeterministicQuestionImpactScoreDto {
  questionId: string;
  questionCode: string;
  questionVersionId: string;
  attributeKey: string;
  deterministicQuestionImpactScore: number;
  eligibilityRelevanceScore: number;
  recommendationUnlockScore: number;
  criticalFactImpactScore: number;
  downstreamDependencyScore: number;
  citizenEffortPenalty: number;
  tieBreakerReason?: PrioritizationTieBreakerReason;
  configurationVersion: number;
  prioritizationRationale: string;
}

export interface QuestionExplanationDto {
  questionId: string;
  questionCode: string;
  explanation: string;
  requiredForSchemes: string[];
  unlockedRecommendations: string[];
  missingPrerequisiteForJourneys: string[];
}

export interface SubmitAnswerDto {
  sessionId: string;
  questionId: string;
  questionVersionId: string;
  attributeKey: string;
  answerValue: unknown;
  idempotencyKey: string;
}

export interface ProfileChangeImpactDto {
  changedFactKey: string;
  eligibilityReEvaluationRequired: boolean;
  recommendationRecalculationRequired: boolean;
  journeyRevalidationRequired: boolean;
  documentReverificationRequired: boolean;
  noDownstreamImpact: boolean;
  impactReason: string;
  triggerFactValue: unknown;
  affectedDomains: string[];
  configurationVersion: number;
  correlationId: string;
}

export interface ProfileSnapshotDto {
  snapshotId: string;
  profileId: string;
  versionNumber: number;
  facts: Record<string, unknown>;
  factVersions: Record<string, number>;
  sourcePrecedencePolicyVersion: number;
  freshnessPolicyVersions: Record<string, number>;
  completenessConfigurationVersion: number;
  questionCatalogVersion: number;
  prioritizationConfigurationVersion: number;
  checksumSha256: string;
  createdAt: string;
}
