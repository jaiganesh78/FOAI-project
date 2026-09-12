import { describe, it, expect } from 'vitest';
import { ApplicationReadinessService } from '../../../src/modules/recommendation/services/application-readiness.service';
import { ApplicationReadinessStatus } from '@gpios/shared';

describe('ApplicationReadinessService', () => {
  const service = new ApplicationReadinessService();

  it('should evaluate application readiness status as READY when all facts exist', () => {
    const readiness = service.analyzeReadiness({ id: 'pol-1', title: 'Scheme' }, { bankAccountNumber: '1234', aadhaarNumber: '5678' });

    expect(readiness.status).toBe(ApplicationReadinessStatus.READY);
    expect(readiness.completionPercentage).toBe(100);
  });
});
