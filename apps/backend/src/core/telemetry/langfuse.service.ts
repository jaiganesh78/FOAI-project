import { Inject, Injectable, Logger } from '@nestjs/common';
import { Langfuse } from 'langfuse';
import { ConfigService } from '../config/config.service';

@Injectable()
export class LangfuseService {
  private readonly logger = new Logger(LangfuseService.name);
  private langfuse: Langfuse | null = null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const aiConfig = this.configService.ai;
    try {
      this.langfuse = new Langfuse({
        publicKey: aiConfig.langfusePublicKey,
        secretKey: aiConfig.langfuseSecretKey,
        baseUrl: aiConfig.langfuseHost,
      });
      this.logger.log('Langfuse AI Observability Telemetry initialized.');
    } catch (err) {
      this.logger.warn(`Langfuse initialization deferred: ${(err as Error).message}`);
    }
  }

  getTraceInstance() {
    return this.langfuse;
  }
}
