import { Injectable } from '@nestjs/common';
import { ApplicationChecklistDto, ChecklistStatus } from '@gpios/shared';

@Injectable()
export class ChecklistGenerationService {
  generateChecklist(journeyId: string, citizenFacts: Record<string, unknown>): ApplicationChecklistDto {
    const items = [
      {
        id: `chk-1-${journeyId}`,
        itemKey: 'aadhaarNumber',
        title: 'Aadhaar Card Copy & Number Verification',
        type: 'FACT' as const,
        status: citizenFacts.aadhaarNumber ? ChecklistStatus.COMPLETED : ChecklistStatus.PENDING,
        isMandatory: true,
      },
      {
        id: `chk-2-${journeyId}`,
        itemKey: 'bankAccountNumber',
        title: 'Active Bank Passbook Details',
        type: 'FACT' as const,
        status: citizenFacts.bankAccountNumber ? ChecklistStatus.COMPLETED : ChecklistStatus.PENDING,
        isMandatory: true,
      },
      {
        id: `chk-3-${journeyId}`,
        itemKey: 'landHoldingRecord',
        title: 'Land Record Patta / Revenue Receipt Copy',
        type: 'DOCUMENT' as const,
        status: citizenFacts.landHolding ? ChecklistStatus.COMPLETED : ChecklistStatus.PENDING,
        isMandatory: true,
      },
    ];

    const completedCount = items.filter((i) => i.status === ChecklistStatus.COMPLETED).length;
    let status = ChecklistStatus.PENDING;
    if (completedCount === items.length) status = ChecklistStatus.COMPLETED;
    else if (completedCount > 0) status = ChecklistStatus.PARTIALLY_MET;

    return {
      id: `checklist-${journeyId}`,
      journeyId,
      status,
      items,
    };
  }
}
