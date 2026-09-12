import { describe, it, expect } from 'vitest';
import { ExplainabilityService } from '../../../src/modules/eligibility/services/explainability.service';
import { EligibilityStatus } from '@gpios/shared';

describe('ExplainabilityService', () => {
  const mockPrisma = {
    explainabilityTemplate: {
      findUnique: async () => ({
        code: 'EXPLAIN_ELIGIBLE_FARMER',
        templateText: 'Citizen is eligible for {{policy}} because land holding of {{landHolding}} hectares is below maximum threshold of {{threshold}} hectares.',
      }),
    },
  };

  const service = new ExplainabilityService(mockPrisma as any);

  it('should generate template-interpolated explanation without AI', async () => {
    const explanation = await service.generateExplanation(
      EligibilityStatus.ELIGIBLE,
      'PM Kisan Samman Nidhi',
      [],
      { landHolding: 1.5 },
    );

    expect(explanation.humanExplanation).toBe(
      'Citizen is eligible for PM Kisan Samman Nidhi because land holding of 1.5 hectares is below maximum threshold of 2.0 hectares.',
    );
    expect(explanation.technicalExplanation).toBeDefined();
  });
});
