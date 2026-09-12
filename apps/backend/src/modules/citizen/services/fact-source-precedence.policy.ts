import { Injectable } from '@nestjs/common';
import { FactSourcePrecedence } from '@gpios/shared';

@Injectable()
export class FactSourcePrecedencePolicy {
  getPrecedenceValue(source: string): FactSourcePrecedence {
    const s = source.toUpperCase();
    if (s.includes('GOVERNMENT') || s.includes('UIDAI') || s.includes('DIGILOCKER')) {
      return FactSourcePrecedence.GOVERNMENT_VERIFIED;
    }
    if (s.includes('OFFICER') || s.includes('MANUAL')) {
      return FactSourcePrecedence.MANUAL_OFFICER_VERIFIED;
    }
    if (s.includes('DOCUMENT') || s.includes('OCR')) {
      return FactSourcePrecedence.DOCUMENT_DERIVED;
    }
    if (s.includes('SYSTEM')) {
      return FactSourcePrecedence.SYSTEM_DERIVED;
    }
    return FactSourcePrecedence.SELF_DECLARED;
  }

  shouldOverride(existingSource: string, newSource: string): { override: boolean; reason: string } {
    const existingValue = this.getPrecedenceValue(existingSource);
    const newValue = this.getPrecedenceValue(newSource);

    if (newValue < existingValue) {
      return {
        override: true,
        reason: `New source '${newSource}' (Precedence Level ${newValue}) has higher precedence than existing source '${existingSource}' (Precedence Level ${existingValue}).`,
      };
    } else if (newValue === existingValue) {
      return {
        override: true,
        reason: `New source '${newSource}' has equal precedence to existing source '${existingSource}'. Updating to latest value.`,
      };
    } else {
      return {
        override: false,
        reason: `Existing source '${existingSource}' (Precedence Level ${existingValue}) has higher precedence than new source '${newSource}' (Precedence Level ${newValue}). Preserving existing value and logging conflict.`,
      };
    }
  }
}
