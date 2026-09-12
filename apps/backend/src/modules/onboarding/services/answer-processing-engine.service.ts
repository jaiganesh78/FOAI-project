import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  FACT_SOURCE_PRECEDENCE_POLICY,
  CHANGE_IMPACT_ENGINE_SERVICE,
  ONBOARDING_SESSION_ENGINE_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { FactSourcePrecedencePolicy } from '../../citizen/services/fact-source-precedence.policy';
import { ChangeImpactEngineService } from '../../citizen/services/change-impact-engine.service';
import { OnboardingSessionEngineService } from './onboarding-session-engine.service';
import { SubmitAnswerDto, ProfileChangeImpactDto } from '@gpios/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnswerProcessingEngineService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FACT_SOURCE_PRECEDENCE_POLICY) private readonly precedencePolicy: FactSourcePrecedencePolicy,
    @Inject(CHANGE_IMPACT_ENGINE_SERVICE) private readonly changeImpactEngine: ChangeImpactEngineService,
    @Inject(ONBOARDING_SESSION_ENGINE_SERVICE) private readonly sessionEngine: OnboardingSessionEngineService,
  ) {}

  async processAnswer(userId: string, dto: SubmitAnswerDto): Promise<{
    answerId: string;
    factId: string;
    factVersion: number;
    impact: ProfileChangeImpactDto;
    isDuplicateSubmission: boolean;
  }> {
    // Validate session ownership
    await this.sessionEngine.validateSessionOwnership(dto.sessionId, userId);

    // 1. Idempotency Check
    const existingAnswer = await this.prisma.onboardingAnswer.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: dto.idempotencyKey } },
    });

    if (existingAnswer) {
      const existingFact = await this.prisma.citizenFact.findFirst({
        where: { attributeKey: dto.attributeKey, createdBy: userId },
      });
      const impact = this.changeImpactEngine.calculateImpact(dto.attributeKey, dto.answerValue, dto.idempotencyKey);
      return {
        answerId: existingAnswer.id,
        factId: existingFact ? existingFact.id : 'existing-fact-id',
        factVersion: existingFact ? existingFact.version : 1,
        impact,
        isDuplicateSubmission: true,
      };
    }

    // Execute atomic 13-operation Prisma Transaction
    return this.prisma.$transaction(async (tx) => {
      // Step A: Ensure profile exists
      let profile = await tx.citizenProfile.findUnique({ where: { userId } });
      if (!profile) {
        profile = await tx.citizenProfile.create({ data: { userId } });
      }

      // Step B: Save OnboardingAnswer
      const answer = await tx.onboardingAnswer.create({
        data: {
          userId,
          sessionId: dto.sessionId,
          questionId: dto.questionId,
          questionVersionId: dto.questionVersionId,
          attributeKey: dto.attributeKey,
          answerValue: dto.answerValue as Prisma.InputJsonValue,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      await tx.onboardingAnswerVersion.create({
        data: {
          answerId: answer.id,
          version: 1,
          newValue: dto.answerValue as Prisma.InputJsonValue,
          changedBy: userId,
        },
      });

      // Step C: Check source precedence & existing fact
      const existingFact = await tx.citizenFact.findUnique({
        where: { profileId_attributeKey: { profileId: profile.id, attributeKey: dto.attributeKey } },
      });

      let factId = '';
      let factVersion = 1;
      let previousValue: unknown = null;

      const newSource = 'SELF_DECLARED';
      const newPrecedence = this.precedencePolicy.getPrecedenceValue(newSource);

      if (existingFact) {
        const { override, reason } = this.precedencePolicy.shouldOverride(existingFact.source, newSource);
        if (!override) {
          throw new BadRequestException(reason);
        }
        previousValue = existingFact.valueBoolean ?? existingFact.valueNumber ?? existingFact.valueDate ?? existingFact.valueText ?? existingFact.valueJson;
        factVersion = existingFact.version + 1;

        let valueText: string | null = null;
        let valueNumber: number | null = null;
        let valueBoolean: boolean | null = null;
        let valueJson: Prisma.InputJsonValue = undefined as any;

        if (typeof dto.answerValue === 'string') valueText = dto.answerValue;
        else if (typeof dto.answerValue === 'number') valueNumber = dto.answerValue;
        else if (typeof dto.answerValue === 'boolean') valueBoolean = dto.answerValue;
        else valueJson = dto.answerValue as Prisma.InputJsonValue;

        const updated = await tx.citizenFact.update({
          where: { id: existingFact.id },
          data: {
            valueText,
            valueNumber,
            valueBoolean,
            valueJson,
            source: newSource,
            sourcePrecedence: newPrecedence,
            version: factVersion,
            updatedAt: new Date(),
          },
        });
        factId = updated.id;
      } else {
        let valueText: string | null = null;
        let valueNumber: number | null = null;
        let valueBoolean: boolean | null = null;
        let valueJson: Prisma.InputJsonValue = undefined as any;

        if (typeof dto.answerValue === 'string') valueText = dto.answerValue;
        else if (typeof dto.answerValue === 'number') valueNumber = dto.answerValue;
        else if (typeof dto.answerValue === 'boolean') valueBoolean = dto.answerValue;
        else valueJson = dto.answerValue as Prisma.InputJsonValue;

        const created = await tx.citizenFact.create({
          data: {
            profileId: profile.id,
            attributeKey: dto.attributeKey,
            valueText,
            valueNumber,
            valueBoolean,
            valueJson,
            source: newSource,
            sourcePrecedence: newPrecedence,
            createdBy: userId,
          },
        });
        factId = created.id;
      }

      // Step D: Create FactVersion & Provenance
      await tx.citizenFactVersion.create({
        data: {
          factId,
          version: factVersion,
          previousValue: (previousValue as Prisma.InputJsonValue) || undefined,
          newValue: dto.answerValue as Prisma.InputJsonValue,
          source: newSource,
          sourcePrecedence: newPrecedence,
          changedBy: userId,
          correlationId: dto.idempotencyKey,
        },
      });

      await tx.factProvenance.create({
        data: {
          factId,
          sourceType: 'ONBOARDING_ANSWER',
          actorId: userId,
          verificationMethod: 'SELF_DECLARED',
        },
      });

      // Step E: Compute Change Impact
      const impact = this.changeImpactEngine.calculateImpact(dto.attributeKey, dto.answerValue, dto.idempotencyKey);

      await tx.profileChange.create({
        data: {
          userId,
          changedFactKey: dto.attributeKey,
          previousValue: (previousValue as Prisma.InputJsonValue) || undefined,
          newValue: dto.answerValue as Prisma.InputJsonValue,
          eligibilityReEvaluationRequired: impact.eligibilityReEvaluationRequired,
          recommendationRecalculationRequired: impact.recommendationRecalculationRequired,
          journeyRevalidationRequired: impact.journeyRevalidationRequired,
          documentReverificationRequired: impact.documentReverificationRequired,
          noDownstreamImpact: impact.noDownstreamImpact,
          impactReason: impact.impactReason,
          triggerFactValue: dto.answerValue as Prisma.InputJsonValue,
          affectedDomains: impact.affectedDomains as Prisma.InputJsonValue,
          correlationId: dto.idempotencyKey,
        },
      });

      // Step F: Transactional Event Outbox Record
      await tx.onboardingEvent.create({
        data: {
          eventId: `evt_${dto.idempotencyKey}`,
          eventType: 'onboarding.question_answered',
          aggregateId: dto.sessionId,
          userId,
          correlationId: dto.idempotencyKey,
          payload: {
            questionId: dto.questionId,
            questionVersionId: dto.questionVersionId,
            attributeKey: dto.attributeKey,
            factId,
            factVersion,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        answerId: answer.id,
        factId,
        factVersion,
        impact,
        isDuplicateSubmission: false,
      };
    });
  }
}
