import { Inject, Injectable } from '@nestjs/common';
import {
  QUESTION_CATALOG_REPOSITORY,
  QUESTION_VISIBILITY_ENGINE,
} from '../../../core/tokens/injection-tokens';
import { IQuestionCatalogRepository } from '../repositories/question-catalog.repository.interface';
import { QuestionVisibilityEngine } from './question-visibility.engine';
import { DiscoveryContext } from './discovery-context.object';
import { QuestionDto, StepQuestionsDto, QuestionInputType } from '@gpios/shared';

export interface BlueprintStep {
  stepKey: string;
  title: string;
  category: string;
  displayOrder: number;
}

@Injectable()
export class OnboardingWorkflowEngine {
  constructor(
    @Inject(QUESTION_CATALOG_REPOSITORY) private readonly questionCatalogRepository: IQuestionCatalogRepository,
    @Inject(QUESTION_VISIBILITY_ENGINE) private readonly visibilityEngine: QuestionVisibilityEngine,
  ) {}

  async getQuestionsForStep(context: DiscoveryContext): Promise<StepQuestionsDto> {
    const blueprint = context.blueprint;
    const steps = (blueprint.stepOrdering as unknown as BlueprintStep[]) || [];
    const currentStepConfig = steps.find((s) => s.stepKey === context.currentStepKey) || steps[0];

    const catalogQuestions = await this.questionCatalogRepository.findByDisplayGroup(currentStepConfig.stepKey);

    const evaluatedQuestions: QuestionDto[] = [];
    for (const q of catalogQuestions) {
      const state = this.visibilityEngine.evaluateQuestion(q, context);
      if (state.isVisible) {
        evaluatedQuestions.push({
          id: q.id,
          questionCode: q.questionCode,
          attributeKey: q.attributeKey,
          label: q.label,
          description: q.description,
          helpText: q.helpText,
          placeholder: q.placeholder,
          inputType: q.inputType as QuestionInputType,
          options: (q.options as { label: string; value: string }[]) || null,
          renderingMetadata: (q.renderingMetadata as Record<string, unknown>) || null,
          displayGroup: q.displayGroup,
          displayOrder: q.displayOrder,
          isRequired: state.isRequired,
          isVisible: state.isVisible,
          isDisabled: state.isDisabled,
          currentValue: state.currentValue,
        });
      }
    }

    return {
      stepKey: currentStepConfig.stepKey,
      stepTitle: currentStepConfig.title,
      questions: evaluatedQuestions,
    };
  }

  getNextStep(steps: BlueprintStep[], currentStepKey: string): string | null {
    const currentIndex = steps.findIndex((s) => s.stepKey === currentStepKey);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].stepKey;
    }
    return null;
  }
}
