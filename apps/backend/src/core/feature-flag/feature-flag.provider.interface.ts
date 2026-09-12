export interface IFeatureFlagProvider {
  isEnabled(flagKey: string, context?: Record<string, unknown>): Promise<boolean>;
  getFlagValue<T>(flagKey: string, defaultValue: T): Promise<T>;
}
