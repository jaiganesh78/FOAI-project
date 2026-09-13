import { SemanticResolutionResult, SemanticValidationResult } from '../interfaces/semantic.interface';

export interface ResolveSemanticValueDto {
  attributeCode: string;
  rawValue: unknown;
  unit?: string;
}

export type ResolveSemanticValueResponseDto = SemanticResolutionResult;

export interface ValidateSemanticValueDto {
  attributeCode: string;
  value: unknown;
  unit?: string;
}

export type ValidateSemanticValueResponseDto = SemanticValidationResult;

export interface ConvertSemanticUnitDto {
  value: number;
  fromUnit: string;
  toUnit: string;
}

export interface ConvertSemanticUnitResponseDto {
  value: number;
  fromUnit: string;
  toUnit: string;
  convertedValue: number;
}
