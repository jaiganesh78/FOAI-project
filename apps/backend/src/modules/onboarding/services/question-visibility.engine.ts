import { Injectable } from '@nestjs/common';
import { QuestionCatalogWithAttribute } from '../repositories/question-catalog.repository.interface';
import { DiscoveryContext } from './discovery-context.object';

export interface EvaluatedQuestionState {
  question: QuestionCatalogWithAttribute;
  isVisible: boolean;
  isDisabled: boolean;
  isRequired: boolean;
  currentValue: unknown;
}

@Injectable()
export class QuestionVisibilityEngine {
  evaluateQuestion(
    question: QuestionCatalogWithAttribute,
    context: DiscoveryContext,
  ): EvaluatedQuestionState {
    const attribute = question.attribute;
    let isVisible = true;
    let isDisabled = false;

    // Check Parent Attribute Dependency
    if (attribute.parentKey) {
      const parentVal = context.getFactValue(attribute.parentKey);
      if (parentVal === null || parentVal === undefined) {
        isVisible = false;
      } else if (attribute.activationCondition) {
        const strVal = String(parentVal).toLowerCase();
        if (strVal !== attribute.activationCondition.toLowerCase()) {
          isVisible = false;
        }
      }
    }

    const currentValue = context.getFactValue(attribute.key);
    const isRequired = attribute.isMandatory && isVisible;

    return {
      question,
      isVisible,
      isDisabled,
      isRequired,
      currentValue,
    };
  }
}
