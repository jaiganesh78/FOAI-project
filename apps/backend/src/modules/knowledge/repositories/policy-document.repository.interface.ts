import { PolicyDocument, PolicyLifecycleStatus, DocumentClassification } from '@prisma/client';

export interface CreatePolicyDocumentData {
  sourceId: string;
  documentNumber: string;
  title: string;
  classification?: DocumentClassification;
  status?: PolicyLifecycleStatus;
}

export interface IPolicyDocumentRepository {
  findById(id: string): Promise<PolicyDocument | null>;
  findByDocumentNumber(documentNumber: string): Promise<PolicyDocument | null>;
  findByStatus(status: PolicyLifecycleStatus): Promise<PolicyDocument[]>;
  findAll(): Promise<PolicyDocument[]>;
  createDocument(data: CreatePolicyDocumentData): Promise<PolicyDocument>;
  updateStatus(id: string, status: PolicyLifecycleStatus): Promise<PolicyDocument>;
  incrementVersion(id: string): Promise<PolicyDocument>;
}
