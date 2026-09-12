import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER, EVENT_DISPATCHER } from '../tokens/injection-tokens';
import { BullMQEventAdapter } from './bullmq-event.adapter';

@Global()
@Module({
  providers: [
    BullMQEventAdapter,
    {
      provide: EVENT_PUBLISHER,
      useExisting: BullMQEventAdapter,
    },
    {
      provide: EVENT_DISPATCHER,
      useExisting: BullMQEventAdapter,
    },
  ],
  exports: [EVENT_PUBLISHER, EVENT_DISPATCHER, BullMQEventAdapter],
})
export class EventBusModule {}
