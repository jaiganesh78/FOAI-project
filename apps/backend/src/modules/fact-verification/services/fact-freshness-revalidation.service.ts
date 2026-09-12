import { Inject, Injectable } from '@nestjs/common';
import { FACT_FRESHNESS_ENGINE_SERVICE } from '../../../core/tokens/injection-tokens';
import { FactFreshnessEngineService } from '../../citizen/services/fact-freshness-engine.service';
import { FactFreshnessDto } from '@gpios/shared';

@Injectable()
export class FactFreshnessRevalidationService {
  constructor(
    @Inject(FACT_FRESHNESS_ENGINE_SERVICE) private readonly freshnessEngine: FactFreshnessEngineService,
  ) {}

  async revalidateFreshness(attributeKey: string, factUpdatedAt: Date): Promise<FactFreshnessDto> {
    return this.freshnessEngine.evaluateFreshness(attributeKey, factUpdatedAt);
  }
}
