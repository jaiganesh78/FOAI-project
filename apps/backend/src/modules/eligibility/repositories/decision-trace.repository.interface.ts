import { DecisionTrace, DecisionTraceNode, DecisionTraceEdge, EligibilityStatus } from '@prisma/client';

export interface CreateDecisionTraceData {
  userId: string;
  citizenSnapshotId: string;
  policyVersionId: string;
  policyRuleVersionId: string;
  status: EligibilityStatus;
  executionDurationMs: number;
  correlationId: string;
  evaluatedRulesCount: number;
  passedRulesCount: number;
  failedRulesCount: number;
  skippedRulesCount: number;
  nodes?: { nodeType: string; label: string; status: string; metadata?: Record<string, unknown> }[];
  edges?: { sourceNodeId: string; targetNodeId: string; relationship: string }[];
}

export interface DecisionTraceWithGraph extends DecisionTrace {
  nodes: DecisionTraceNode[];
  edges: DecisionTraceEdge[];
}

export interface IDecisionTraceRepository {
  findById(id: string): Promise<DecisionTraceWithGraph | null>;
  findByUserId(userId: string): Promise<DecisionTraceWithGraph[]>;
  createTrace(data: CreateDecisionTraceData): Promise<DecisionTraceWithGraph>;
}
