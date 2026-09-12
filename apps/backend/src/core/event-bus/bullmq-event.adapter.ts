import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IEventPublisher } from './event-publisher.interface';
import { IEventDispatcher } from './event-dispatcher.interface';
import { IDomainEvent } from './domain-event.interface';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BullMQEventAdapter implements IEventPublisher, IEventDispatcher {
  private readonly logger = new Logger(BullMQEventAdapter.name);
  private queue: Queue | null = null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    try {
      const redis = this.configService.redis;
      this.queue = new Queue('gpios-domain-events', {
        connection: {
          host: redis.host,
          port: redis.port,
          password: redis.password || undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`BullMQ Queue initialization deferred: ${(err as Error).message}`);
    }
  }

  async publish<T>(event: IDomainEvent<T>): Promise<void> {
    this.logger.log(`Publishing domain event: ${event.eventName} [ID: ${event.eventId}]`);
    if (this.queue) {
      await this.queue.add(event.eventName, event);
    }
  }

  async publishAll<T>(events: IDomainEvent<T>[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async dispatch<T>(event: IDomainEvent<T>): Promise<void> {
    await this.publish(event);
  }
}
