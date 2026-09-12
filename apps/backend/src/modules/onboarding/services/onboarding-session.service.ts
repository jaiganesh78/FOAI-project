import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingSession } from '@prisma/client';
import {
  ONBOARDING_SESSION_REPOSITORY,
  DISCOVERY_BLUEPRINT_REPOSITORY,
  QUESTION_CATALOG_REPOSITORY,
  ANSWER_NORMALIZATION_ENGINE,
  PROGRESS_CALCULATION_STRATEGY,
  ONBOARDING_WORKFLOW_ENGINE,
  ONBOARDING_ANALYTICS_SERVICE,
  CITIZEN_QUERY_SERVICE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IOnboardingSessionRepository } from '../repositories/onboarding-session.repository.interface';
import { IDiscoveryBlueprintRepository } from '../repositories/discovery-blueprint.repository.interface';
import { IQuestionCatalogRepository } from '../repositories/question-catalog.repository.interface';
import { AnswerNormalizationEngine } from './answer-normalization.engine';
import { IProgressCalculationStrategy } from './progress-calculation.strategy';
import { OnboardingWorkflowEngine, BlueprintStep } from './onboarding-workflow.engine';
import { OnboardingAnalyticsService } from './onboarding-analytics.service';
import { ICitizenQueryService } from '../../citizen/services/citizen-query.service';
import { CitizenFactService } from '../../citizen/services/citizen-fact.service';
import { DiscoveryContext } from './discovery-context.object';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import {
  OnboardingSessionDto,
  OnboardingProgressDto,
  SubmitAnswerInputDto,
  StepQuestionsDto,
  DomainEventRegistry,
  OnboardingSessionStatus,
  AttributeDataType,
} from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class OnboardingSessionService {
  constructor(
    @Inject(ONBOARDING_SESSION_REPOSITORY) private readonly sessionRepository: IOnboardingSessionRepository,
    @Inject(DISCOVERY_BLUEPRINT_REPOSITORY) private readonly blueprintRepository: IDiscoveryBlueprintRepository,
    @Inject(QUESTION_CATALOG_REPOSITORY) private readonly questionCatalogRepository: IQuestionCatalogRepository,
    @Inject(ANSWER_NORMALIZATION_ENGINE) private readonly normalizationEngine: AnswerNormalizationEngine,
    @Inject(PROGRESS_CALCULATION_STRATEGY) private readonly progressStrategy: IProgressCalculationStrategy,
    @Inject(ONBOARDING_WORKFLOW_ENGINE) private readonly workflowEngine: OnboardingWorkflowEngine,
    @Inject(ONBOARDING_ANALYTICS_SERVICE) private readonly analyticsService: OnboardingAnalyticsService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly citizenQueryService: ICitizenQueryService,
    @Inject(CitizenFactService) private readonly citizenFactService: CitizenFactService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async getOrCreateSession(userId: string, blueprintCode = 'DEFAULT_CITIZEN'): Promise<OnboardingSessionDto> {
    let session = await this.sessionRepository.findByUserId(userId);
    if (!session) {
      const blueprint = await this.blueprintRepository.findByCode(blueprintCode);
      if (!blueprint) {
        throw new NotFoundException(`Discovery Blueprint '${blueprintCode}' not found.`);
      }

      const steps = (blueprint.stepOrdering as unknown as BlueprintStep[]) || [];
      const initialStep = steps.length > 0 ? steps[0].stepKey : 'personal_info';

      session = await this.sessionRepository.createSession({
        userId,
        blueprintId: blueprint.id,
        blueprintVersion: blueprint.version,
        currentStep: initialStep,
        status: OnboardingSessionStatus.STARTED,
        updatedBy: userId,
      });

      await this.sessionRepository.logTimelineEvent(session.id, 'STARTED', initialStep, undefined, {
        blueprintCode,
      });

      await this.eventPublisher.publish({
        eventId: randomUUID(),
        eventName: DomainEventRegistry.Onboarding.Started,
        eventVersion: '1.0',
        aggregateId: session.id,
        occurredOn: this.clockProvider.now(),
        occurredAt: this.clockProvider.now(),
        payload: {
          sessionId: session.id,
          userId,
          blueprintCode,
          blueprintVersion: blueprint.version,
        },
      });
    }

    return this.mapToSessionDto(session);
  }

  async getQuestionsForCurrentStep(userId: string): Promise<StepQuestionsDto> {
    const session = await this.sessionRepository.findByUserId(userId);
    if (!session) throw new NotFoundException('Onboarding session not found.');

    const blueprint = await this.blueprintRepository.findById(session.blueprintId);
    if (!blueprint) throw new NotFoundException('Discovery blueprint not found.');

    const answeredFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    const context = new DiscoveryContext(userId, session, blueprint, answeredFacts, session.currentStep);

    return this.workflowEngine.getQuestionsForStep(context);
  }

  async submitAnswer(userId: string, dto: SubmitAnswerInputDto): Promise<{ success: boolean; nextStep: string | null }> {
    const session = await this.sessionRepository.findByUserId(userId);
    if (!session) throw new NotFoundException('Onboarding session not found.');

    const question = await this.questionCatalogRepository.findByQuestionCode(dto.questionKey);
    if (!question) throw new NotFoundException(`Question '${dto.questionKey}' not found in Question Catalog.`);

    // 1. Normalize Raw Answer Input
    const normalizedValue = this.normalizationEngine.normalize(
      dto.rawInput,
      question.attribute.dataType as AttributeDataType,
    );

    // 2. Persist to Citizen Knowledge Profile via Sprint 2 CitizenFactService (validates & snapshots)
    await this.citizenFactService.addFactForUser(userId, {
      attributeKey: question.attributeKey,
      value: normalizedValue,
    });

    // 3. Update Session Timeline & Analytics
    await this.sessionRepository.logTimelineEvent(session.id, 'QUESTION_ANSWERED', session.currentStep, question.questionCode, {
      attributeKey: question.attributeKey,
      normalizedValue,
    });

    await this.analyticsService.trackQuestionAnswered(session.blueprintId, session.currentStep);

    // 4. Recalculate Session Progress
    const blueprint = await this.blueprintRepository.findById(session.blueprintId);
    const answeredFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    const context = new DiscoveryContext(userId, session, blueprint!, answeredFacts, session.currentStep);

    const steps = (blueprint!.stepOrdering as unknown as BlueprintStep[]) || [];
    const progress = this.progressStrategy.calculateProgress(context, steps.length);

    await this.sessionRepository.updateSession(session.id, {
      completionPercentage: progress.completionPercentage,
      status: OnboardingSessionStatus.IN_PROGRESS,
      updatedBy: userId,
    });

    // 5. Emit Domain Event
    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Onboarding.QuestionAnswered,
      eventVersion: '1.0',
      aggregateId: session.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        sessionId: session.id,
        userId,
        stepKey: session.currentStep,
        questionKey: question.questionCode,
        attributeKey: question.attributeKey,
        rawInput: dto.rawInput,
        normalizedValue,
        answerStatus: dto.status || 'SUBMITTED',
      },
    });

    const nextStep = this.workflowEngine.getNextStep(steps, session.currentStep);
    return { success: true, nextStep };
  }

  async updateSessionStep(userId: string, stepKey: string, action?: string): Promise<OnboardingSessionDto> {
    const session = await this.sessionRepository.findByUserId(userId);
    if (!session) throw new NotFoundException('Onboarding session not found.');

    const completedSteps = (session.completedSteps as string[]) || [];
    if (!completedSteps.includes(session.currentStep) && action === 'NAVIGATE') {
      completedSteps.push(session.currentStep);
    }

    const updated = await this.sessionRepository.updateSession(session.id, {
      currentStep: stepKey,
      completedSteps,
      status: action === 'PAUSE' ? OnboardingSessionStatus.PAUSED : OnboardingSessionStatus.IN_PROGRESS,
      updatedBy: userId,
    });

    await this.sessionRepository.logTimelineEvent(session.id, action || 'NAVIGATE', stepKey);

    return this.mapToSessionDto(updated);
  }

  async getProgress(userId: string): Promise<OnboardingProgressDto> {
    const session = await this.sessionRepository.findByUserId(userId);
    if (!session) throw new NotFoundException('Onboarding session not found.');

    const blueprint = await this.blueprintRepository.findById(session.blueprintId);
    const answeredFacts = await this.citizenQueryService.getStructuredFactsByUserId(userId);
    const context = new DiscoveryContext(userId, session, blueprint!, answeredFacts, session.currentStep);

    const steps = (blueprint!.stepOrdering as unknown as BlueprintStep[]) || [];
    return this.progressStrategy.calculateProgress(context, steps.length);
  }

  async completeOnboarding(userId: string): Promise<OnboardingSessionDto> {
    const session = await this.sessionRepository.findByUserId(userId);
    if (!session) throw new NotFoundException('Onboarding session not found.');

    const completed = await this.sessionRepository.updateSession(session.id, {
      status: OnboardingSessionStatus.COMPLETED,
      completionPercentage: 100.0,
      updatedBy: userId,
      changeReason: 'Citizen completed onboarding workflow',
    });

    await this.sessionRepository.logTimelineEvent(session.id, 'COMPLETED', session.currentStep);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Onboarding.Completed,
      eventVersion: '1.0',
      aggregateId: session.id,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        sessionId: session.id,
        userId,
        completionPercentage: 100.0,
        completedAt: this.clockProvider.now(),
      },
    });

    return this.mapToSessionDto(completed);
  }

  private mapToSessionDto(session: OnboardingSession & { blueprint?: { code: string } | null }): OnboardingSessionDto {
    return {
      id: session.id,
      userId: session.userId,
      blueprintCode: session.blueprint ? session.blueprint.code : session.blueprintId,
      blueprintVersion: session.blueprintVersion,
      currentStep: session.currentStep,
      completedSteps: (session.completedSteps as string[]) || [],
      skippedSteps: (session.skippedSteps as string[]) || [],
      completionPercentage: session.completionPercentage,
      status: session.status as OnboardingSessionStatus,
      version: session.version,
      lastActivityAt: session.lastActivityAt.toISOString(),
    };
  }
}
