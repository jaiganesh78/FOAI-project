import { QuestionCatalog } from '@prisma/client';

export interface QuestionCatalogWithAttribute extends QuestionCatalog {
  attribute: {
    key: string;
    displayName: string;
    category: string;
    dataType: string;
    isMandatory: boolean;
    parentKey: string | null;
    activationCondition: string | null;
    validationRules: unknown;
  };
}

export interface IQuestionCatalogRepository {
  findByQuestionCode(code: string): Promise<QuestionCatalogWithAttribute | null>;
  findByAttributeKey(attributeKey: string): Promise<QuestionCatalogWithAttribute | null>;
  findByDisplayGroup(displayGroup: string): Promise<QuestionCatalogWithAttribute[]>;
  findAllActive(): Promise<QuestionCatalogWithAttribute[]>;
}
