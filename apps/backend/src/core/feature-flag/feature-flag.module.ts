import { Global, Module } from '@nestjs/common';
import { FEATURE_FLAG_PROVIDER } from '../tokens/injection-tokens';
import { InMemoryFeatureFlagAdapter } from './in-memory-feature-flag.adapter';

@Global()
@Module({
  providers: [
    InMemoryFeatureFlagAdapter,
    {
      provide: FEATURE_FLAG_PROVIDER,
      useExisting: InMemoryFeatureFlagAdapter,
    },
  ],
  exports: [FEATURE_FLAG_PROVIDER, InMemoryFeatureFlagAdapter],
})
export class FeatureFlagModule {}
