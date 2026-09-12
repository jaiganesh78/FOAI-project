import { Injectable } from '@nestjs/common';
import { IFeatureFlagProvider } from './feature-flag.provider.interface';

@Injectable()
export class InMemoryFeatureFlagAdapter implements IFeatureFlagProvider {
  private readonly flags = new Map<string, boolean>([
    ['FEATURE_AI_ELIGIBILITY_ENGINE', true],
    ['FEATURE_NEW_POLICY_INDEXER', false],
  ]);

  async isEnabled(flagKey: string): Promise<boolean> {
    return this.flags.get(flagKey) ?? false;
  }

  async getFlagValue<T>(flagKey: string, defaultValue: T): Promise<T> {
    const val = this.flags.get(flagKey);
    return val !== undefined ? (val as unknown as T) : defaultValue;
  }
}
