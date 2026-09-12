import { Injectable } from '@nestjs/common';
import { AttributeDataType } from '@prisma/client';

@Injectable()
export class AnswerNormalizationEngine {
  normalize(rawInput: unknown, dataType: AttributeDataType): unknown {
    if (rawInput === null || rawInput === undefined || rawInput === '') {
      return null;
    }

    switch (dataType) {
      case AttributeDataType.NUMBER:
        return this.normalizeNumber(rawInput);

      case AttributeDataType.BOOLEAN:
        return this.normalizeBoolean(rawInput);

      case AttributeDataType.DATE:
        return this.normalizeDate(rawInput);

      case AttributeDataType.TEXT:
      case AttributeDataType.ENUM:
        return String(rawInput).trim();

      case AttributeDataType.JSON:
        return typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;

      default:
        return rawInput;
    }
  }

  private normalizeNumber(rawInput: unknown): number {
    if (typeof rawInput === 'number') return rawInput;

    let str = String(rawInput).trim().toLowerCase();
    // Strip currency symbols, commas, and whitespace
    str = str.replace(/[₹,$\s]/g, '');

    // Handle Indian numbering shorthand (Lakh / Crore)
    if (str.includes('lakh') || str.includes('l')) {
      const val = parseFloat(str.replace(/lakhs?|l/, ''));
      return val * 100000;
    }
    if (str.includes('crore') || str.includes('cr')) {
      const val = parseFloat(str.replace(/crores?|cr/, ''));
      return val * 10000000;
    }
    if (str.includes('k')) {
      const val = parseFloat(str.replace('k', ''));
      return val * 1000;
    }

    const num = parseFloat(str);
    return isNaN(num) ? Number(rawInput) : num;
  }

  private normalizeBoolean(rawInput: unknown): boolean {
    if (typeof rawInput === 'boolean') return rawInput;
    const str = String(rawInput).trim().toLowerCase();
    return ['true', 'yes', 'y', '1', 'enabled'].includes(str);
  }

  private normalizeDate(rawInput: unknown): Date {
    if (rawInput instanceof Date) return rawInput;
    return new Date(rawInput as string | number);
  }
}
