import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { STORAGE_PROVIDER } from '../tokens/injection-tokens';
import { IStorageProvider } from '../storage/storage.provider.interface';
import { ConfigService } from '../config/config.service';
import { HealthState } from '@gpios/shared';

@Injectable()
export class HealthService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async getOverallHealth() {
    const dbOk = await this.prismaService.isHealthy();
    const redisOk = await this.redisService.isHealthy();
    const storageOk = await this.storageProvider.isHealthy();

    let state = HealthState.HEALTHY;
    if (!dbOk && !redisOk) {
      state = HealthState.CRITICAL;
    } else if (!dbOk || !redisOk || !storageOk) {
      state = HealthState.DEGRADED;
    }

    return {
      status: state,
      appName: this.configService.app.appName,
      version: this.configService.app.appVersion,
      environment: this.configService.app.nodeEnv,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
        storage: storageOk ? 'up' : 'down',
      },
    };
  }

  async getReadiness() {
    const dbOk = await this.prismaService.isHealthy();
    const redisOk = await this.redisService.isHealthy();

    return {
      status: dbOk && redisOk ? HealthState.HEALTHY : HealthState.DEGRADED,
      ready: dbOk,
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? 'ready' : 'not_ready',
        redis: redisOk ? 'ready' : 'not_ready',
      },
    };
  }

  getLiveness() {
    return {
      status: HealthState.HEALTHY,
      live: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
