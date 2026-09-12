import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { JourneyTimelineEventDto, TimelineEventType } from '@gpios/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class JourneyTimelineService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async recordTimelineEvent(params: {
    journeyId: string;
    eventType: TimelineEventType;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<JourneyTimelineEventDto> {
    const record = await this.prisma.journeyTimeline.create({
      data: {
        journeyId: params.journeyId,
        eventType: params.eventType,
        description: params.description,
        metadata: (params.metadata as Prisma.InputJsonValue) || {},
      },
    });

    return {
      id: record.id,
      journeyId: record.journeyId,
      eventType: record.eventType as TimelineEventType,
      description: record.description,
      timestamp: record.timestamp.toISOString(),
      metadata: (record.metadata as Record<string, unknown>) || undefined,
    };
  }

  async getTimelineForJourney(journeyId: string): Promise<JourneyTimelineEventDto[]> {
    const records = await this.prisma.journeyTimeline.findMany({
      where: { journeyId },
      orderBy: { timestamp: 'asc' },
    });

    return records.map((r) => ({
      id: r.id,
      journeyId: r.journeyId,
      eventType: r.eventType as TimelineEventType,
      description: r.description,
      timestamp: r.timestamp.toISOString(),
      metadata: (r.metadata as Record<string, unknown>) || undefined,
    }));
  }
}
