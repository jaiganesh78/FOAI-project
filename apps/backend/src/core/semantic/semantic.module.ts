import { Module, Global } from '@nestjs/common';
import { SemanticRegistryService } from './semantic-registry.service';
import { PolicyDerivedClassificationService } from './policy-derived-classification.service';
import {
  SEMANTIC_REGISTRY_SERVICE,
  POLICY_DERIVED_CLASSIFICATION_SERVICE,
} from '../tokens/injection-tokens';

@Global()
@Module({
  providers: [
    SemanticRegistryService,
    PolicyDerivedClassificationService,
    {
      provide: SEMANTIC_REGISTRY_SERVICE,
      useExisting: SemanticRegistryService,
    },
    {
      provide: POLICY_DERIVED_CLASSIFICATION_SERVICE,
      useExisting: PolicyDerivedClassificationService,
    },
  ],
  exports: [
    SemanticRegistryService,
    PolicyDerivedClassificationService,
    SEMANTIC_REGISTRY_SERVICE,
    POLICY_DERIVED_CLASSIFICATION_SERVICE,
  ],
})
export class SemanticModule {}
