import { KnowledgeSource } from '@prisma/client';
import { CreateKnowledgeSourceInputDto } from '@gpios/shared';

export interface IKnowledgeSourceRepository {
  findById(id: string): Promise<KnowledgeSource | null>;
  findByCode(code: string): Promise<KnowledgeSource | null>;
  findAllActive(): Promise<KnowledgeSource[]>;
  createSource(data: CreateKnowledgeSourceInputDto): Promise<KnowledgeSource>;
  updateSource(id: string, data: Partial<KnowledgeSource>): Promise<KnowledgeSource>;
  updateHealthStatus(id: string, status: string): Promise<void>;
  softDelete(id: string): Promise<boolean>;
}
