import { Injectable } from '@nestjs/common';

export interface ExtractedMetadataResult {
  ministry?: string;
  department?: string;
  schemeName?: string;
  state?: string;
  district?: string;
  beneficiaryCategory?: string;
  rawAmountText?: string;
  extractionConfidence: number;
  extractionMethod: string;
  extractedBy: string;
  sourceLocation: string;
}

@Injectable()
export class MetadataExtractionService {
  extractMetadata(text: string, title: string): ExtractedMetadataResult {
    const combined = (title + ' ' + text).toLowerCase();

    let state: string | undefined;
    if (combined.includes('tamil nadu') || combined.includes('tn')) state = 'Tamil Nadu';
    else if (combined.includes('maharashtra')) state = 'Maharashtra';

    let beneficiaryCategory: string | undefined;
    if (combined.includes('farmer') || combined.includes('kisan')) beneficiaryCategory = 'FARMER';
    else if (combined.includes('student') || combined.includes('scholarship')) beneficiaryCategory = 'STUDENT';
    else if (combined.includes('senior citizen')) beneficiaryCategory = 'SENIOR_CITIZEN';

    let rawAmountText: string | undefined;
    const amountMatch = text.match(/(rs\.?|inr|₹)\s*[\d,.]+(\s*(lakh|lakhs|crore|crores|k))?/i);
    if (amountMatch) {
      rawAmountText = amountMatch[0];
    }

    return {
      ministry: combined.includes('agriculture') ? 'Ministry of Agriculture' : 'Ministry of Electronics & IT',
      schemeName: title,
      state,
      beneficiaryCategory,
      rawAmountText,
      extractionConfidence: 0.95,
      extractionMethod: 'DETERMINISTIC_REGEX',
      extractedBy: 'SYSTEM_PARSER',
      sourceLocation: 'Title & Main Body',
    };
  }
}
