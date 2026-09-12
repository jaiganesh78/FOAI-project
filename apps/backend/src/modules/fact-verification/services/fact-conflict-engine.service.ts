import { Injectable } from '@nestjs/common';
import { FactConflictCategory, ConflictSeverity, FactConflictDetailDto } from '@gpios/shared';

@Injectable()
export class FactConflictEngineService {
  classifyConflict(params: {
    conflictId?: string;
    citizenId: string;
    factId: string;
    attributeKey: string;
    competingValues: Array<{ source: string; value: unknown }>;
    isExpired: boolean;
    trustScore: number;
    hasProvenance: boolean;
    policyVersion: number;
  }): FactConflictDetailDto {
    let category = FactConflictCategory.VALUE_MISMATCH;
    let severity = ConflictSeverity.MEDIUM;

    if (!params.hasProvenance) {
      category = FactConflictCategory.INCOMPLETE_EVIDENCE;
      severity = ConflictSeverity.HIGH;
    } else if (params.isExpired) {
      category = FactConflictCategory.EXPIRED_EVIDENCE;
      severity = ConflictSeverity.HIGH;
    } else if (params.trustScore < 70) {
      category = FactConflictCategory.LOW_TRUST_EVIDENCE;
      severity = ConflictSeverity.MEDIUM;
    } else if (params.competingValues.length > 1) {
      const uniqueVals = new Set(params.competingValues.map((v) => JSON.stringify(v.value)));
      if (uniqueVals.size > 1) {
        const hasGov = params.competingValues.some((v) => v.source.includes('GOVERNMENT'));
        category = hasGov ? FactConflictCategory.SOURCE_CONFLICT : FactConflictCategory.VALUE_MISMATCH;
        severity = hasGov ? ConflictSeverity.CRITICAL : ConflictSeverity.HIGH;
      } else {
        category = FactConflictCategory.DUPLICATE_FACT;
        severity = ConflictSeverity.LOW;
      }
    }

    return {
      conflictId: params.conflictId || `conflict_${params.factId}_${Date.now()}`,
      citizenId: params.citizenId,
      factId: params.factId,
      attributeKey: params.attributeKey,
      category,
      severity,
      competingValues: params.competingValues,
      evidenceReferences: [],
      status: 'DETECTED',
      detectedAt: new Date().toISOString(),
      policyVersion: params.policyVersion,
    };
  }
}
