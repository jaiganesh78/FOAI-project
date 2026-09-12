import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const monitoring = this.configService.monitoring;
    if (monitoring.sentryDsn) {
      try {
        Sentry.init({
          dsn: monitoring.sentryDsn,
          environment: this.configService.app.nodeEnv,
          tracesSampleRate: 1.0,
        });
        this.logger.log('Sentry Error Monitoring initialized.');
      } catch (err) {
        this.logger.warn(`Sentry initialization skipped: ${(err as Error).message}`);
      }
    }
  }

  captureException(exception: unknown, context?: Record<string, unknown>) {
    if (this.configService.monitoring.sentryDsn) {
      Sentry.captureException(exception, { extra: context });
    }
  }
}
