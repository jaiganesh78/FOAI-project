import { describe, it, expect } from 'vitest';
import { ChecklistGenerationService } from '../../../src/modules/application-journey/services/checklist-generation.service';
import { ChecklistStatus } from '@gpios/shared';

describe('ChecklistGenerationService', () => {
  const service = new ChecklistGenerationService();

  it('should generate checklist and set item statuses based on citizen facts', () => {
    const checklist = service.generateChecklist('j-1', { aadhaarNumber: '1234' });

    expect(checklist.items.length).toBe(3);
    expect(checklist.items[0].status).toBe(ChecklistStatus.COMPLETED);
    expect(checklist.status).toBe(ChecklistStatus.PARTIALLY_MET);
  });
});
