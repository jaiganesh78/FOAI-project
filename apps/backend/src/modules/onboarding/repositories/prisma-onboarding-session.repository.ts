import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IOnboardingSessionRepository,
  CreateSessionData,
  UpdateSessionData,
} from './onboarding-session.repository.interface';
import { OnboardingSession, OnboardingSessionStatus, Prisma } from '@prisma/client';

@Injectable()
export class PrismaOnboardingSessionRepository implements IOnboardingSessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<OnboardingSession | null> {
    return this.prisma.onboardingSession.findFirst({
      where: { userId, deletedAt: null },
      include: { blueprint: true },
    });
  }

  async findById(id: string): Promise<OnboardingSession | null> {
    return this.prisma.onboardingSession.findFirst({
      where: { id, deletedAt: null },
      include: { blueprint: true },
    });
  }

  async createSession(data: CreateSessionData): Promise<OnboardingSession> {
    return this.prisma.onboardingSession.create({
      data: {
        userId: data.userId,
        blueprintId: data.blueprintId,
        blueprintVersion: data.blueprintVersion,
        currentStep: data.currentStep,
        completedSteps: (data.completedSteps as Prisma.InputJsonValue) || [],
        skippedSteps: (data.skippedSteps as Prisma.InputJsonValue) || [],
        status: data.status || OnboardingSessionStatus.STARTED,
        updatedBy: data.updatedBy,
      },
    });
  }

  async updateSession(id: string, data: UpdateSessionData): Promise<OnboardingSession> {
    const existing = await this.prisma.onboardingSession.findUnique({ where: { id } });
    if (!existing) throw new Error(`Session ${id} not found`);

    const updateData: Prisma.OnboardingSessionUpdateInput = {
      version: { increment: 1 },
      updatedBy: data.updatedBy,
      lastActivityAt: new Date(),
    };

    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;
    if (data.completedSteps !== undefined) updateData.completedSteps = data.completedSteps as Prisma.InputJsonValue;
    if (data.skippedSteps !== undefined) updateData.skippedSteps = data.skippedSteps as Prisma.InputJsonValue;
    if (data.draftAnswers !== undefined) updateData.draftAnswers = data.draftAnswers as Prisma.InputJsonValue;
    if (data.completionPercentage !== undefined) updateData.completionPercentage = data.completionPercentage;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === OnboardingSessionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }
    if (data.changeReason !== undefined) updateData.changeReason = data.changeReason;
    if (data.previousState !== undefined) updateData.previousState = data.previousState;

    return this.prisma.onboardingSession.update({
      where: { id },
      data: updateData,
    });
  }

  async logTimelineEvent(
    sessionId: string,
    eventType: string,
    stepKey?: string,
    questionKey?: string,
    details?: unknown,
  ): Promise<void> {
    await this.prisma.onboardingSessionTimeline.create({
      data: {
        sessionId,
        eventType,
        stepKey: stepKey || null,
        questionKey: questionKey || null,
        details: (details as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });
  }

  async softDelete(id: string): Promise<boolean> {
    await this.prisma.onboardingSession.update({
      where: { id },
      data: { deletedAt: new Date(), status: OnboardingSessionStatus.ABANDONED },
    });
    return true;
  }
}
