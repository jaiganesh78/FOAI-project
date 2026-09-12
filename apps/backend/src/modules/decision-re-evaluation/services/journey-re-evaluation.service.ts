import { Inject, Injectable } from '@nestjs/common';
import { APPLICATION_JOURNEY_ORCHESTRATOR, JOURNEY_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { ApplicationJourneyOrchestrator } from '../../application-journey/services/application-journey.orchestrator';
import { JourneyQueryService } from '../../application-journey/services/journey-query.service';
import { ApplicationJourneyDto } from '@gpios/shared';

@Injectable()
export class JourneyReEvaluationService {
  constructor(
    @Inject(APPLICATION_JOURNEY_ORCHESTRATOR) private readonly orchestrator: ApplicationJourneyOrchestrator,
    @Inject(JOURNEY_QUERY_SERVICE) private readonly queryService: JourneyQueryService,
  ) {}

  async getLatestState(userId: string): Promise<Record<string, unknown> | null> {
    const journeys = await this.queryService.getJourneysByUserId(userId);
    return journeys && journeys.length > 0 ? (journeys[0] as unknown as Record<string, unknown>) : null;
  }

  async execute(userId: string, policyId = 'pol-pm-kisan'): Promise<ApplicationJourneyDto> {
    return this.orchestrator.generateJourney(userId, policyId);
  }
}
