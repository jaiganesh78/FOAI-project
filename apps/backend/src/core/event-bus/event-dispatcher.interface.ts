import { IDomainEvent } from './domain-event.interface';

export interface IEventDispatcher {
  dispatch<T>(event: IDomainEvent<T>): Promise<void>;
}
