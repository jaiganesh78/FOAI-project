import { Inject, Injectable, Logger } from '@nestjs/common';
import { FACT_USAGE_INDEX_SERVICE } from '../../../core/tokens/injection-tokens';
import { FactUsageIndexService } from './fact-usage-index.service';

@Injectable()
export class IncrementalEvaluationService {
  private readonly logger = new Logger(IncrementalEvaluationService.name);

  constructor(@Inject(FACT_USAGE_INDEX_SERVICE) private readonly factUsageIndex: FactUsageIndexService) {}

  shouldReEvaluate(changedAttributes: string[]): { shouldEvaluate: boolean; affectedRules: string[] } {
    const affectedRules = this.factUsageIndex.getAffectedRuleCodes(changedAttributes);
    const shouldEvaluate = affectedRules.length > 0 || changedAttributes.length === 0;

    this.logger.log(`Incremental evaluation check for attributes [${changedAttributes.join(', ')}]: ${affectedRules.length} affected rules prunings.`);
    return { shouldEvaluate, affectedRules };
  }
}
