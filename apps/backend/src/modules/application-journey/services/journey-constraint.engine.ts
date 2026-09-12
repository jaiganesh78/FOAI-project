import { Injectable, BadRequestException } from '@nestjs/common';
import { JourneyStepStatus } from '@gpios/shared';

export interface ConstraintValidationContext {
  stepId: string;
  stepCode: string;
  prerequisiteStepStatuses: Record<string, JourneyStepStatus>;
  deadlinePassed: boolean;
  documentUploaded: boolean;
  verificationComplete: boolean;
}

export interface ConstraintValidationResult {
  isValid: boolean;
  violations: string[];
}

@Injectable()
export class JourneyConstraintEngine {
  evaluateStepCompletionConstraints(context: ConstraintValidationContext): ConstraintValidationResult {
    const violations: string[] = [];

    // 1. Dependency Constraints
    for (const [prereqId, status] of Object.entries(context.prerequisiteStepStatuses)) {
      if (status !== JourneyStepStatus.COMPLETED) {
        violations.push(`Prerequisite step '${prereqId}' must be COMPLETED before executing '${context.stepCode}'.`);
      }
    }

    // 2. Deadline Constraints
    if (context.deadlinePassed) {
      violations.push(`Application deadline has passed. Cannot complete step '${context.stepCode}'.`);
    }

    // 3. Document Constraints
    if (context.stepCode.includes('DOCUMENT') && !context.documentUploaded) {
      violations.push(`Required document copy must be uploaded prior to completing step '${context.stepCode}'.`);
    }

    // 4. Verification Constraints
    if (context.stepCode.includes('VERIFY') && !context.verificationComplete) {
      violations.push(`Verification process incomplete for step '${context.stepCode}'.`);
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  assertStepCanBeCompleted(context: ConstraintValidationContext): void {
    const result = this.evaluateStepCompletionConstraints(context);
    if (!result.isValid) {
      throw new BadRequestException(`Step completion blocked by constraint violations: ${result.violations.join(' | ')}`);
    }
  }
}
