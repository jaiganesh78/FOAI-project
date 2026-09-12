import { Global, Module } from '@nestjs/common';
import { CLOCK_PROVIDER } from '../tokens/injection-tokens';
import { SystemClockProvider } from './system-clock.provider';

@Global()
@Module({
  providers: [
    SystemClockProvider,
    {
      provide: CLOCK_PROVIDER,
      useExisting: SystemClockProvider,
    },
  ],
  exports: [CLOCK_PROVIDER, SystemClockProvider],
})
export class ClockModule {}
