import { Evidence, EvidenceVersion, EvidenceTrustScore, EvidenceGraph } from '@prisma/client';
import { EvidenceStatus } from '@gpios/shared';

export type EvidenceWithDetails = Evidence & {
  versions: EvidenceVersion[];
  trustScore: EvidenceTrustScore | null;
  graphs: EvidenceGraph[];
};

export interface IEvidenceRepository {
  createEvidence(data: {
    documentId: string;
    userId: string;
    factKey: string;
    factValue: unknown;
    status: EvidenceStatus;
  }): Promise<EvidenceWithDetails>;

  findById(id: string): Promise<EvidenceWithDetails | null>;
  findByDocumentId(documentId: string): Promise<EvidenceWithDetails[]>;
  findByUserId(userId: string): Promise<EvidenceWithDetails[]>;
  updateStatus(id: string, status: EvidenceStatus): Promise<EvidenceWithDetails>;
  createVersion(evidenceId: string, version: number, factKey: string, factValue: unknown, status: EvidenceStatus): Promise<EvidenceVersion>;
  saveTrustScore(evidenceId: string, trustScoreData: Record<string, unknown>): Promise<EvidenceTrustScore>;
  saveGraph(evidenceId: string, graphData: Record<string, unknown>): Promise<EvidenceGraph>;
}
