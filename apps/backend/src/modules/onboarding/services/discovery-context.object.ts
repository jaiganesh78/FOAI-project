import { DiscoveryBlueprint, OnboardingSession } from '@prisma/client';

export class DiscoveryContext {
  constructor(
    public readonly userId: string,
    public readonly session: OnboardingSession,
    public readonly blueprint: DiscoveryBlueprint,
    public readonly answeredFacts: Record<string, unknown>,
    public readonly currentStepKey: string,
  ) {}

  hasFact(attributeKey: string): boolean {
    return this.answeredFacts[attributeKey] !== undefined && this.answeredFacts[attributeKey] !== null;
  }

  getFactValue<T = unknown>(attributeKey: string): T | null {
    return (this.answeredFacts[attributeKey] as T) ?? null;
  }
}
