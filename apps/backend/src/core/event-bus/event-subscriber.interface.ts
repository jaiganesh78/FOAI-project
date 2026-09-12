import { IDomainEvent } from './domain-event.interface';

export interface IEventSubscriber<T = unknown> {
  subscribe(eventName: string, handler: (event: IDomainEvent<T>) => Promise<void>): void;
}
