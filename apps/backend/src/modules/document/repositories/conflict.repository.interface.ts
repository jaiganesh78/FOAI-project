import { FactConflict, FactReconciliation } from '@prisma/client';
import { ConflictStatus, ConflictResolutionType } from '@gpios/shared';

export type ConflictWithReconciliations = FactConflict & {
  reconciliations: FactReconciliation[];
};

export interface IConflictRepository {
  createConflict(data: {
    documentId: string;
    userId: string;
    factKey: string;
    declaredValue: unknown;
    extractedValue: unknown;
  }): Promise<ConflictWithReconciliations>;

  findById(id: string): Promise<ConflictWithReconciliations | null>;
  findByDocumentId(documentId: string): Promise<ConflictWithReconciliations[]>;
  findByUserId(userId: string): Promise<ConflictWithReconciliations[]>;
  updateStatus(id: string, status: ConflictStatus): Promise<ConflictWithReconciliations>;
  createReconciliation(data: {
    conflictId: string;
    documentId: string;
    userId: string;
    factKey: string;
    resolutionType: ConflictResolutionType;
    finalValue: unknown;
    reconciledBy: string;
  }): Promise<FactReconciliation>;
}
