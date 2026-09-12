import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  IApplicationJourneyRepository,
  ApplicationJourneyWithDetails,
} from './journey.repository.interface';
import {
  ApplicationJourneyStatus,
  JourneyStepStatus,
  JourneyUrgency,
} from '@gpios/shared';
import { ApplicationJourneyStep, ChecklistStatus, JourneyHistory, Prisma } from '@prisma/client';

@Injectable()
export class PrismaApplicationJourneyRepository implements IApplicationJourneyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJourney(data: {
    userId: string;
    policyId: string;
    policyTitle: string;
    blueprintId: string;
    urgency: JourneyUrgency;
    readinessScore: number;
  }): Promise<ApplicationJourneyWithDetails> {
    return this.prisma.applicationJourney.create({
      data: {
        userId: data.userId,
        policyId: data.policyId,
        policyTitle: data.policyTitle,
        blueprintId: data.blueprintId,
        urgency: data.urgency,
        readinessScore: data.readinessScore,
        status: ApplicationJourneyStatus.CREATED,
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checklist: { include: { items: true } },
        actionPlan: true,
      },
    }) as unknown as ApplicationJourneyWithDetails;
  }

  async findById(id: string): Promise<ApplicationJourneyWithDetails | null> {
    return this.prisma.applicationJourney.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checklist: { include: { items: true } },
        actionPlan: true,
      },
    }) as unknown as ApplicationJourneyWithDetails | null;
  }

  async findLatestByUserId(userId: string): Promise<ApplicationJourneyWithDetails | null> {
    return this.prisma.applicationJourney.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checklist: { include: { items: true } },
        actionPlan: true,
      },
    }) as unknown as ApplicationJourneyWithDetails | null;
  }

  async findByUserId(userId: string): Promise<ApplicationJourneyWithDetails[]> {
    return this.prisma.applicationJourney.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checklist: { include: { items: true } },
        actionPlan: true,
      },
    }) as unknown as ApplicationJourneyWithDetails[];
  }

  async updateStatus(id: string, status: ApplicationJourneyStatus): Promise<ApplicationJourneyWithDetails> {
    return this.prisma.applicationJourney.update({
      where: { id },
      data: { status },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checklist: { include: { items: true } },
        actionPlan: true,
      },
    }) as unknown as ApplicationJourneyWithDetails;
  }

  async updateStepStatus(stepId: string, status: JourneyStepStatus): Promise<ApplicationJourneyStep> {
    return this.prisma.applicationJourneyStep.update({
      where: { id: stepId },
      data: { status, updatedAt: new Date() },
    });
  }

  async addHistory(journeyId: string, action: string, details: Record<string, unknown>): Promise<JourneyHistory> {
    return this.prisma.journeyHistory.create({
      data: {
        journeyId,
        action,
        details: (details as Prisma.InputJsonValue) || {},
      },
    });
  }

  async saveChecklist(journeyId: string, checklistData: Record<string, unknown>): Promise<void> {
    await this.prisma.applicationChecklist.create({
      data: {
        journeyId,
        status: 'PARTIALLY_MET',
        items: {
          create: ((checklistData.items as Array<Record<string, unknown>>) || []).map((item) => ({
            itemKey: (item.itemCode as string) || 'ITEM_KEY',
            title: item.title as string,
            type: (item.itemType as string) || 'FACT',
            status: item.status as ChecklistStatus,
          })),
        },
      },
    });
  }
}
