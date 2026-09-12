import { describe, it, expect } from 'vitest';
import { AnswerNormalizationEngine } from '../../../src/modules/onboarding/services/answer-normalization.engine';
import { AttributeDataType } from '@prisma/client';

describe('AnswerNormalizationEngine', () => {
  const engine = new AnswerNormalizationEngine();

  it('should normalize Indian lakh currency strings into numbers', () => {
    expect(engine.normalize('2.5 Lakhs', AttributeDataType.NUMBER)).toBe(250000);
    expect(engine.normalize('₹2,50,000', AttributeDataType.NUMBER)).toBe(250000);
    expect(engine.normalize('100k', AttributeDataType.NUMBER)).toBe(100000);
  });

  it('should normalize boolean strings into boolean primitives', () => {
    expect(engine.normalize('yes', AttributeDataType.BOOLEAN)).toBe(true);
    expect(engine.normalize('true', AttributeDataType.BOOLEAN)).toBe(true);
    expect(engine.normalize('no', AttributeDataType.BOOLEAN)).toBe(false);
  });

  it('should trim string inputs', () => {
    expect(engine.normalize('  Ramesh Kumar  ', AttributeDataType.TEXT)).toBe('Ramesh Kumar');
  });
});
