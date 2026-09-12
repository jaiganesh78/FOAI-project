import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { PrismaCitizenFactRepository } from '../../../src/modules/citizen/repositories/prisma-citizen-fact.repository';
import { PrismaService } from '../../../src/core/database/prisma.service';

describe('Fact Versioning & History (Integration Tests)', () => {
  it('PrismaCitizenFactRepository should exist and expose contract methods', () => {
    const mockPrisma = {} as PrismaService;
    const repo = new PrismaCitizenFactRepository(mockPrisma);

    expect(repo.upsertFact).toBeDefined();
    expect(repo.updateFact).toBeDefined();
    expect(repo.softDeleteFact).toBeDefined();
  });
});
