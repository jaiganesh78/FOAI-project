import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNEY_BLUEPRINT_REPOSITORY } from '../../../core/tokens/injection-tokens';
import {
  IJourneyBlueprintRepository,
  JourneyBlueprintWithVersions,
} from '../repositories/journey-blueprint.repository.interface';
import { ApplicationJourneyStepDto, StepExecutionMode, StepOwner, StepBlockingBehavior, JourneyStepStatus } from '@gpios/shared';

@Injectable()
export class JourneyBlueprintService {
  constructor(
    @Inject(JOURNEY_BLUEPRINT_REPOSITORY) private readonly blueprintRepo: IJourneyBlueprintRepository,
  ) {}

  async resolveInheritedSteps(blueprintId: string): Promise<ApplicationJourneyStepDto[]> {
    const blueprint = await this.blueprintRepo.findById(blueprintId);
    if (!blueprint) {
      throw new NotFoundException(`Journey Blueprint '${blueprintId}' not found.`);
    }

    const inheritanceChain: JourneyBlueprintWithVersions[] = [blueprint];
    let current = blueprint;

    while (current.parentBlueprintId) {
      const parent = await this.blueprintRepo.findById(current.parentBlueprintId);
      if (!parent) break;
      inheritanceChain.unshift(parent);
      current = parent;
    }

    // Merge steps from Root -> Domain -> Policy Blueprint
    const stepMap = new Map<string, ApplicationJourneyStepDto>();

    for (const bp of inheritanceChain) {
      const defaultSteps = this.getDefaultStepsForBlueprint(bp.id, bp.policyTitle);
      for (const step of defaultSteps) {
        stepMap.set(step.stepCode, step);
      }
    }

    return Array.from(stepMap.values()).sort((a, b) => a.order - b.order);
  }

  async getBlueprintById(id: string): Promise<JourneyBlueprintWithVersions> {
    const bp = await this.blueprintRepo.findById(id);
    if (!bp) throw new NotFoundException(`Blueprint '${id}' not found.`);
    return bp;
  }

  async getBlueprintByPolicyId(policyId: string): Promise<JourneyBlueprintWithVersions | null> {
    return this.blueprintRepo.findByPolicyId(policyId);
  }

  private getDefaultStepsForBlueprint(blueprintId: string, policyTitle: string): ApplicationJourneyStepDto[] {
    if (blueprintId === 'bp-root-benefit-app') {
      return [
        {
          id: 'step-root-1',
          stepCode: 'VERIFY_AADHAAR',
          title: 'Verify Aadhaar Identity',
          description: 'Ensure citizen identity and Aadhaar link are verified',
          status: JourneyStepStatus.NOT_STARTED,
          order: 1,
          isOptional: false,
          executionPolicy: {
            executionMode: StepExecutionMode.MANUAL,
            owner: StepOwner.CITIZEN,
            retryLimit: 3,
            retryIntervalMs: 60000,
            blockingBehavior: StepBlockingBehavior.BLOCKING,
            timeoutMs: 86400000,
            requiresVerification: true,
          },
          prerequisiteStepIds: [],
          blockedByStepIds: [],
        },
        {
          id: 'step-root-2',
          stepCode: 'VERIFY_BANK',
          title: 'Verify Bank Account Details',
          description: 'Verify active bank account for direct benefit transfer',
          status: JourneyStepStatus.NOT_STARTED,
          order: 2,
          isOptional: false,
          executionPolicy: {
            executionMode: StepExecutionMode.AUTOMATIC,
            owner: StepOwner.CITIZEN,
            retryLimit: 3,
            retryIntervalMs: 60000,
            blockingBehavior: StepBlockingBehavior.BLOCKING,
            timeoutMs: 86400000,
            requiresVerification: true,
          },
          prerequisiteStepIds: ['step-root-1'],
          blockedByStepIds: [],
        },
      ];
    }

    if (blueprintId === 'bp-domain-farmer') {
      return [
        {
          id: 'step-farmer-1',
          stepCode: 'COLLECT_LAND_RECORD',
          title: 'Provide Land Record (Patta/RoR)',
          description: 'Verify landholding ownership and document evidence',
          status: JourneyStepStatus.NOT_STARTED,
          order: 3,
          isOptional: false,
          executionPolicy: {
            executionMode: StepExecutionMode.MANUAL,
            owner: StepOwner.CITIZEN,
            retryLimit: 3,
            retryIntervalMs: 60000,
            blockingBehavior: StepBlockingBehavior.BLOCKING,
            timeoutMs: 86400000,
            requiresVerification: true,
          },
          prerequisiteStepIds: ['step-root-2'],
          blockedByStepIds: [],
        },
      ];
    }

    // Concrete Policy Blueprint (PM-KISAN)
    return [
      {
        id: 'step-pmax-1',
        stepCode: 'SUBMIT_APPLICATION',
        title: `Submit ${policyTitle} Application`,
        description: `Submit final application bundle for ${policyTitle}`,
        status: JourneyStepStatus.NOT_STARTED,
        order: 4,
        isOptional: false,
        executionPolicy: {
          executionMode: StepExecutionMode.MANUAL,
          owner: StepOwner.CITIZEN,
          retryLimit: 3,
          retryIntervalMs: 60000,
          blockingBehavior: StepBlockingBehavior.BLOCKING,
          timeoutMs: 86400000,
          requiresVerification: true,
        },
        prerequisiteStepIds: ['step-farmer-1'],
        blockedByStepIds: [],
      },
    ];
  }
}
