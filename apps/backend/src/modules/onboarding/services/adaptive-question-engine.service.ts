import { Inject, Injectable } from '@nestjs/common';
import {
  ONBOARDING_QUESTION_REPOSITORY,
  QUESTION_DEPENDENCY_ENGINE_SERVICE,
  QUESTION_PRIORITIZATION_ENGINE_SERVICE,
  DOCUMENT_AWARE_QUESTION_ENGINE_SERVICE,
  CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY,
} from '../../../core/tokens/injection-tokens';
import { IOnboardingQuestionRepository } from '../repositories/onboarding-question.repository.interface';
import { QuestionDependencyEngineService } from './question-dependency-engine.service';
import { QuestionPrioritizationEngineService } from './question-prioritization-engine.service';
import { DocumentAwareQuestionEngineService } from './document-aware-question-engine.service';
import { ICitizenKnowledgeProfileRepository } from '../../citizen/repositories/citizen-knowledge-profile.repository.interface';
import { OnboardingQuestionDto, QuestionOptionDto, QuestionDependencyDto } from '@gpios/shared';

@Injectable()
export class AdaptiveQuestionEngineService {
  constructor(
    @Inject(ONBOARDING_QUESTION_REPOSITORY) private readonly questionRepo: IOnboardingQuestionRepository,
    @Inject(QUESTION_DEPENDENCY_ENGINE_SERVICE) private readonly dependencyEngine: QuestionDependencyEngineService,
    @Inject(QUESTION_PRIORITIZATION_ENGINE_SERVICE) private readonly prioritizationEngine: QuestionPrioritizationEngineService,
    @Inject(DOCUMENT_AWARE_QUESTION_ENGINE_SERVICE) private readonly documentEngine: DocumentAwareQuestionEngineService,
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_REPOSITORY) private readonly profileRepo: ICitizenKnowledgeProfileRepository,
  ) {}

  async getNextBestQuestion(userId: string): Promise<OnboardingQuestionDto | null> {
    const allQuestions = await this.questionRepo.findAllActiveQuestions();
    if (allQuestions.length === 0) return null;

    // Detect dependency cycles before graph evaluation
    const graphNodes = allQuestions.map((q) => {
      const activeVersion = q.versions[0];
      return {
        id: q.id,
        dependencies: activeVersion ? activeVersion.dependencies.map((d) => ({ parentQuestionId: d.parentQuestionId })) : [],
      };
    });
    this.dependencyEngine.detectCycles(graphNodes);

    // Fetch existing citizen facts
    const facts = await this.profileRepo.findProfileFacts(userId);
    const knownFactsMap: Record<string, unknown> = {};
    for (const f of facts) {
      knownFactsMap[f.attributeKey] = f.valueBoolean ?? f.valueNumber ?? f.valueDate ?? f.valueText ?? f.valueJson;
    }

    // Filter questions not yet answered
    const candidateQuestions = [];
    for (const q of allQuestions) {
      const activeVersion = q.versions[0];
      if (!activeVersion) continue;

      if (knownFactsMap[q.attributeKey] !== undefined) {
        continue; // Fact already known
      }

      // Check document-aware auto-skip
      const docCheck = await this.documentEngine.checkDocumentSatisfaction(userId, q.attributeKey);
      if (docCheck.isSatisfied) {
        continue; // Question satisfied by active document
      }

      // Check dependencies
      let dependenciesSatisfied = true;
      for (const dep of activeVersion.dependencies) {
        const depDto: QuestionDependencyDto = {
          id: dep.id,
          dependentQuestionId: dep.dependentQuestionId,
          parentQuestionId: dep.parentQuestionId,
          parentAttributeKey: dep.parentAttributeKey,
          operator: dep.operator as any,
          expectedValue: dep.expectedValue,
        };
        if (!this.dependencyEngine.evaluateDependency(depDto, knownFactsMap)) {
          dependenciesSatisfied = false;
          break;
        }
      }

      if (dependenciesSatisfied) {
        candidateQuestions.push({
          questionId: q.id,
          questionCode: q.questionCode,
          questionVersionId: activeVersion.id,
          attributeKey: q.attributeKey,
          priority: q.priority,
          inputType: activeVersion.inputType,
          question: q,
          activeVersion,
        });
      }
    }

    if (candidateQuestions.length === 0) return null;

    // Prioritize candidates with DeterministicQuestionImpactScore
    const scoredList = await this.prioritizationEngine.calculatePrioritization(candidateQuestions);
    const topScored = scoredList[0];
    const winner = candidateQuestions.find((c) => c.questionId === topScored.questionId);
    if (!winner) return null;

    const options: QuestionOptionDto[] = winner.activeVersion.options.map((o) => ({
      id: o.id,
      optionCode: o.optionCode,
      label: o.label,
      value: o.value,
      displayOrder: o.displayOrder,
      metadata: (o.metadata as any) || undefined,
    }));

    const dependencies: QuestionDependencyDto[] = winner.activeVersion.dependencies.map((d) => ({
      id: d.id,
      dependentQuestionId: d.dependentQuestionId,
      parentQuestionId: d.parentQuestionId,
      parentAttributeKey: d.parentAttributeKey,
      operator: d.operator as any,
      expectedValue: d.expectedValue,
    }));

    return {
      id: winner.question.id,
      questionCode: winner.question.questionCode,
      version: winner.activeVersion.version,
      attributeKey: winner.question.attributeKey,
      questionText: winner.activeVersion.questionText,
      helpText: winner.activeVersion.helpText || undefined,
      inputType: winner.activeVersion.inputType as any,
      isRequired: winner.activeVersion.isRequired,
      options,
      dependencies,
      priority: winner.question.priority,
      displayOrder: winner.question.displayOrder,
      explanationTemplate: winner.activeVersion.explanationTemplate,
      isActive: winner.question.isActive,
    };
  }
}
