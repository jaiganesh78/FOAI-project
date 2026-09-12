import { describe, it, expect } from 'vitest';
import { JourneyTimelineService } from '../../../src/modules/application-journey/services/journey-timeline.service';
import { TimelineEventType } from '@gpios/shared';

describe('JourneyTimelineService', () => {
  const mockPrisma = {
    journeyTimeline: {
      create: async (data: any) => ({ id: 'evt-1', timestamp: new Date(), ...data }),
      findMany: async () => [{ id: 'evt-1', eventType: 'JOURNEY_CREATED', description: 'Desc', timestamp: new Date() }],
    },
  };

  const service = new JourneyTimelineService(mockPrisma as any);

  it('should record timeline event and return chronological history', async () => {
    await service.recordTimelineEvent({
      journeyId: 'j-1',
      eventType: TimelineEventType.JOURNEY_CREATED,
      description: 'Journey initialized',
    });

    const timeline = await service.getTimelineForJourney('j-1');
    expect(timeline.length).toBe(1);
  });
});
