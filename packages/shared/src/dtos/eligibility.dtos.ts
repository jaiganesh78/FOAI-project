import {
  EligibilityStatus,
  RuleOperator,
  LogicalGroupOperator,
  RuleEvaluationCost,
  OpportunityGapType,
} from '../enums/eligibility.enum';

export interface RuleConditionDto {
  id: string;
  attributeKey: string;
  operator: RuleOperator;
  expectedValue: unknown;
  description?: string | null;
  estimatedCost: RuleEvaluationCost;
}

export interface RuleGroupDto {
  id: string;
  logicalOperator: LogicalGroupOperator;
  thresholdX?: number | null;
  conditions: RuleConditionDto[];
  childGroups?: RuleGroupDto[];
}

export interface PolicyRuleVersionDto {
  id: string;
  ruleId: string;
  versionNumber: number;
  logicFingerprint: string;
  isCurrent: boolean;
  groups: RuleGroupDto[];
}

export interface PolicyRuleDto {
  id: string;
  policyVersionId: string;
  ruleCode: string;
  name: string;
  description?: string | null;
  estimatedCost: RuleEvaluationCost;
  isActive: boolean;
  currentVersion?: PolicyRuleVersionDto;
}

export interface EligibilityEvaluationResultDto {
  policyId: string;
  policyNumber: string;
  policyTitle: string;
  status: EligibilityStatus;
  passedRules: string[];
  failedRules: string[];
  skippedRules: string[];
  humanExplanation: string;
  technicalExplanation: string;
}

export interface DecisionTraceDto {
  id: string;
  userId: string;
  citizenSnapshotId: string;
  policyVersionId: string;
  policyRuleVersionId: string;
  status: EligibilityStatus;
  executionDurationMs: number;
  traceVersion: string;
  engineVersion: string;
  correlationId: string;
  evaluatedRulesCount: number;
  passedRulesCount: number;
  failedRulesCount: number;
  skippedRulesCount: number;
  createdAt: string;
  nodes?: { id: string; nodeType: string; label: string; status: string }[];
  edges?: { sourceNodeId: string; targetNodeId: string; relationship: string }[];
}

export interface OpportunityAnalysisDto {
  id: string;
  gapType: OpportunityGapType;
  description: string;
  requiredAction: string;
  potentialBenefitAmount?: number | null;
  gapValue?: unknown;
}

export interface BenefitAnalysisDto {
  id: string;
  totalMonetaryValue: number;
  recurringMonthlyValue: number;
  oneTimeGrantValue: number;
  urgencyLevel: string;
  applicationDeadline?: string | null;
}

export interface EligibilitySnapshotDto {
  id: string;
  userId: string;
  citizenSnapshotId: string;
  policyVersionId: string;
  decisionTraceId: string;
  status: EligibilityStatus;
  results: EligibilityEvaluationResultDto[];
  benefitAnalysis?: BenefitAnalysisDto | null;
  opportunityAnalysis?: OpportunityAnalysisDto | null;
  createdAt: string;
}

export interface EvaluationMetricsDto {
  executionDurationMs: number;
  graphDepth: number;
  executedRuleCount: number;
  skippedRuleCount: number;
  dependencyTraversalCount: number;
  cacheHit: boolean;
  replayExecutionTimeMs?: number | null;
  incrementalEvaluationSavingsMs?: number | null;
}
