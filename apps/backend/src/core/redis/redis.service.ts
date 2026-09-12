import { Inject, Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      const redisConfig = this.configService.redis;
      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
      });
    } catch (err) {
      this.logger.warn(`Redis client creation deferred: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis client disconnected cleanly.');
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client) return false;
    try {
      if (this.client.status !== 'ready' && this.client.status !== 'connect') {
        return false;
      }
      const ping = await Promise.race([
        this.client.ping(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000)),
      ]);
      return ping === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }
}
