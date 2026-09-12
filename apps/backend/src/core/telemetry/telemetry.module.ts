import { Global, Module } from '@nestjs/common';
import { LangfuseService } from './langfuse.service';
import { SentryService } from './sentry.service';

@Global()
@Module({
  providers: [LangfuseService, SentryService],
  exports: [LangfuseService, SentryService],
})
export class TelemetryModule {}
