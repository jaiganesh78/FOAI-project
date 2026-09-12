import { describe, it, expect } from 'vitest';
import { QuestionVisibilityEngine } from '../../../src/modules/onboarding/services/question-visibility.engine';
import { DiscoveryContext } from '../../../src/modules/onboarding/services/discovery-context.object';
import { QuestionCatalogWithAttribute } from '../../../src/modules/onboarding/repositories/question-catalog.repository.interface';

describe('QuestionVisibilityEngine', () => {
  const engine = new QuestionVisibilityEngine();

  const mockLandAreaQuestion: QuestionCatalogWithAttribute = {
    id: 'q-land-1',
    questionCode: 'Q_LAND_AREA',
    attributeKey: 'landAreaHectares',
    label: 'Land Area',
    description: null,
    helpText: null,
    placeholder: null,
    inputType: 'NUMBER',
    options: null,
    renderingMetadata: null,
    displayGroup: 'agriculture_info',
    displayOrder: 2,
    variant: 'DEFAULT',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    attribute: {
      key: 'landAreaHectares',
      displayName: 'Land Area Hectares',
      category: 'AGRICULTURE',
      dataType: 'NUMBER',
      isMandatory: false,
      parentKey: 'isFarmer',
      activationCondition: 'true',
      validationRules: null,
    },
  };

  it('should hide dependent question if parent attribute is not set or false', () => {
    const context = new DiscoveryContext(
      'u1',
      { id: 's1', userId: 'u1', currentStep: 'agri' } as any,
      {} as any,
      { isFarmer: false },
      'agri',
    );

    const evaluated = engine.evaluateQuestion(mockLandAreaQuestion, context);
    expect(evaluated.isVisible).toBe(false);
  });

  it('should show dependent question if parent attribute meets activation condition', () => {
    const context = new DiscoveryContext(
      'u1',
      { id: 's1', userId: 'u1', currentStep: 'agri' } as any,
      {} as any,
      { isFarmer: true },
      'agri',
    );

    const evaluated = engine.evaluateQuestion(mockLandAreaQuestion, context);
    expect(evaluated.isVisible).toBe(true);
  });
});
