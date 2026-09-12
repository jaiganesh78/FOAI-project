import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { ICitizenAttributeRegistryRepository } from '../repositories/citizen-attribute-registry.repository.interface';
import { ICitizenFactRepository } from '../repositories/citizen-fact.repository.interface';
import { AttributeDataType, CitizenAttributeRegistry } from '@prisma/client';

export interface ValidatedTypedValue {
  valueText: string | null;
  valueNumber: number | null;
  valueBoolean: boolean | null;
  valueDate: Date | null;
  valueJson: unknown | null;
}

@Injectable()
export class AttributeValidationEngine {
  constructor(
    @Inject(CITIZEN_ATTRIBUTE_REGISTRY_REPOSITORY)
    private readonly attributeRegistryRepository: ICitizenAttributeRegistryRepository,
  ) {}

  async validateAndFormat(
    attributeKey: string,
    rawInput: unknown,
    profileId: string,
    factRepository?: ICitizenFactRepository,
  ): Promise<{ attribute: CitizenAttributeRegistry; typedValue: ValidatedTypedValue }> {
    const attribute = await this.attributeRegistryRepository.findByKey(attributeKey);
    if (!attribute) {
      throw new BadRequestException(`Attribute '${attributeKey}' is not registered in the Master Attribute Registry.`);
    }

    if (rawInput === null || rawInput === undefined) {
      if (attribute.isMandatory) {
        throw new BadRequestException(`Attribute '${attribute.displayName}' (${attributeKey}) is mandatory.`);
      }
      return {
        attribute,
        typedValue: {
          valueText: null,
          valueNumber: null,
          valueBoolean: null,
          valueDate: null,
          valueJson: null,
        },
      };
    }

    // Check Parent Attribute Dependency
    if (attribute.parentKey && factRepository) {
      const parentFact = await factRepository.findByProfileAndKey(profileId, attribute.parentKey);
      if (!parentFact || !parentFact.isCurrent) {
        throw new BadRequestException(
          `Cannot set '${attribute.displayName}' because parent attribute '${attribute.parentKey}' is missing.`,
        );
      }

      if (attribute.activationCondition) {
        const parentVal = parentFact.valueBoolean ?? parentFact.valueText ?? parentFact.valueNumber;
        if (String(parentVal).toLowerCase() !== attribute.activationCondition.toLowerCase()) {
          throw new BadRequestException(
            `Attribute '${attribute.displayName}' requires parent attribute '${attribute.parentKey}' to equal '${attribute.activationCondition}'.`,
          );
        }
      }
    }

    const typedValue = this.validateDataTypeAndFormat(attribute, rawInput);
    return { attribute, typedValue };
  }

  private validateDataTypeAndFormat(attribute: CitizenAttributeRegistry, rawInput: unknown): ValidatedTypedValue {
    const rules = (attribute.validationRules as Record<string, unknown>) || {};

    switch (attribute.dataType) {
      case AttributeDataType.TEXT: {
        const strVal = String(rawInput);
        if (rules['regex']) {
          const rx = new RegExp(String(rules['regex']));
          if (!rx.test(strVal)) {
            throw new BadRequestException(`Attribute '${attribute.displayName}' failed format validation rules.`);
          }
        }
        return { valueText: strVal, valueNumber: null, valueBoolean: null, valueDate: null, valueJson: null };
      }

      case AttributeDataType.NUMBER: {
        const numVal = Number(rawInput);
        if (isNaN(numVal)) {
          throw new BadRequestException(`Attribute '${attribute.displayName}' must be a valid number.`);
        }
        if (rules['min'] !== undefined && numVal < Number(rules['min'])) {
          throw new BadRequestException(`Attribute '${attribute.displayName}' must be at least ${rules['min']}.`);
        }
        if (rules['max'] !== undefined && numVal > Number(rules['max'])) {
          throw new BadRequestException(`Attribute '${attribute.displayName}' cannot exceed ${rules['max']}.`);
        }
        return { valueText: null, valueNumber: numVal, valueBoolean: null, valueDate: null, valueJson: null };
      }

      case AttributeDataType.BOOLEAN: {
        const boolVal = Boolean(rawInput);
        return { valueText: null, valueNumber: null, valueBoolean: boolVal, valueDate: null, valueJson: null };
      }

      case AttributeDataType.DATE: {
        const dateVal = new Date(rawInput as string | number | Date);
        if (isNaN(dateVal.getTime())) {
          throw new BadRequestException(`Attribute '${attribute.displayName}' must be a valid ISO Date string.`);
        }
        return { valueText: null, valueNumber: null, valueBoolean: null, valueDate: dateVal, valueJson: null };
      }

      case AttributeDataType.ENUM: {
        const strVal = String(rawInput);
        const allowed = (rules['allowedValues'] as string[]) || [];
        if (allowed.length > 0 && !allowed.includes(strVal)) {
          throw new BadRequestException(
            `Attribute '${attribute.displayName}' value '${strVal}' is invalid. Allowed: [${allowed.join(', ')}]`,
          );
        }
        return { valueText: strVal, valueNumber: null, valueBoolean: null, valueDate: null, valueJson: null };
      }

      case AttributeDataType.JSON: {
        return { valueText: null, valueNumber: null, valueBoolean: null, valueDate: null, valueJson: rawInput };
      }

      default:
        throw new BadRequestException(`Unsupported attribute data type: ${attribute.dataType}`);
    }
  }
}
