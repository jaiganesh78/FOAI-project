export interface BaseDomainEventPayload {
  eventId: string;
  eventName: string;
  occurredOn: string;
  aggregateId: string;
  traceId?: string;
}

export interface PolicyCreatedEventPayload extends BaseDomainEventPayload {
  eventName: 'policy.created';
  policyId: string;
  title: string;
  category: string;
}
