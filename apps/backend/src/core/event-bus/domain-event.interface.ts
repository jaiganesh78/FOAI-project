export interface IDomainEvent<T = unknown> {
  readonly eventId: string;
  readonly eventName: string;
  readonly eventVersion?: string;
  readonly occurredOn: Date;
  readonly occurredAt?: Date;
  readonly aggregateId: string;
  readonly aggregateVersion?: number;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly payload: T;
}
