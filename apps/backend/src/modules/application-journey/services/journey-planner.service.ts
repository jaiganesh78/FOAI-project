import { Inject, Injectable } from '@nestjs/common';
import { JOURNEY_BLUEPRINT_SERVICE, JOURNEY_DEPENDENCY_GRAPH_SERVICE } from '../../../core/tokens/injection-tokens';
import { JourneyBlueprintService } from './journey-blueprint.service';
import { JourneyDependencyGraphService } from './journey-dependency-graph.service';
import { ApplicationJourneyStepDto } from '@gpios/shared';

@Injectable()
export class JourneyPlannerService {
  constructor(
    @Inject(JOURNEY_BLUEPRINT_SERVICE) private readonly blueprintService: JourneyBlueprintService,
    @Inject(JOURNEY_DEPENDENCY_GRAPH_SERVICE) private readonly graphService: JourneyDependencyGraphService,
  ) {}

  async createPlanForBlueprint(blueprintId: string): Promise<ApplicationJourneyStepDto[]> {
    const rawSteps = await this.blueprintService.resolveInheritedSteps(blueprintId);
    const sortedSteps = this.graphService.topologicalSort(rawSteps);
    return this.graphService.evaluateStepStatuses(sortedSteps);
  }
}
