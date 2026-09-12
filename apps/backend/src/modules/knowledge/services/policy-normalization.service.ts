import { Injectable } from '@nestjs/common';
import { ExtractedMetadataResult } from './metadata-extraction.service';

export interface NormalizedMetadataResult extends ExtractedMetadataResult {
  normalizedAmount?: number;
  normalizedStateCode?: string;
  normalizedCategoryCode?: string;
}

@Injectable()
export class PolicyNormalizationService {
  normalize(extracted: ExtractedMetadataResult): NormalizedMetadataResult {
    let normalizedAmount: number | undefined;
    if (extracted.rawAmountText) {
      normalizedAmount = this.normalizeAmount(extracted.rawAmountText);
    }

    let normalizedStateCode: string | undefined;
    if (extracted.state) {
      if (extracted.state.toLowerCase().includes('tamil nadu')) normalizedStateCode = 'TN';
      else if (extracted.state.toLowerCase().includes('maharashtra')) normalizedStateCode = 'MH';
    }

    return {
      ...extracted,
      normalizedAmount,
      normalizedStateCode,
      normalizedCategoryCode: extracted.beneficiaryCategory,
    };
  }

  private normalizeAmount(rawStr: string): number {
    let str = rawStr.replace(/[₹,$\srs\.inr]/gi, '').toLowerCase();

    if (str.includes('lakh')) {
      const val = parseFloat(str.replace(/lakhs?|l/, ''));
      return val * 100000;
    }
    if (str.includes('crore')) {
      const val = parseFloat(str.replace(/crores?|cr/, ''));
      return val * 10000000;
    }
    if (str.includes('k')) {
      const val = parseFloat(str.replace('k', ''));
      return val * 1000;
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
}
