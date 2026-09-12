import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IQuestionCatalogRepository, QuestionCatalogWithAttribute } from './question-catalog.repository.interface';

@Injectable()
export class PrismaQuestionCatalogRepository implements IQuestionCatalogRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByQuestionCode(code: string): Promise<QuestionCatalogWithAttribute | null> {
    return (await this.prisma.questionCatalog.findFirst({
      where: { questionCode: code, isActive: true },
      include: { attribute: true },
    })) as QuestionCatalogWithAttribute | null;
  }

  async findByAttributeKey(attributeKey: string): Promise<QuestionCatalogWithAttribute | null> {
    return (await this.prisma.questionCatalog.findFirst({
      where: { attributeKey, isActive: true },
      include: { attribute: true },
    })) as QuestionCatalogWithAttribute | null;
  }

  async findByDisplayGroup(displayGroup: string): Promise<QuestionCatalogWithAttribute[]> {
    return (await this.prisma.questionCatalog.findMany({
      where: { displayGroup, isActive: true },
      include: { attribute: true },
      orderBy: { displayOrder: 'asc' },
    })) as QuestionCatalogWithAttribute[];
  }

  async findAllActive(): Promise<QuestionCatalogWithAttribute[]> {
    return (await this.prisma.questionCatalog.findMany({
      where: { isActive: true },
      include: { attribute: true },
      orderBy: { displayOrder: 'asc' },
    })) as QuestionCatalogWithAttribute[];
  }
}
