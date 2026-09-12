import { Inject, Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { AppConfigType } from './app.config';
import { DatabaseConfigType } from './database.config';
import { RedisConfigType } from './redis.config';
import { StorageConfigType } from './storage.config';
import { AIConfigType } from './ai.config';
import { MonitoringConfigType } from './monitoring.config';
import { SecurityConfigType } from './security.config';

@Injectable()
export class ConfigService {
  constructor(@Inject(NestConfigService) private readonly configService: NestConfigService) {}

  get app(): AppConfigType {
    return this.configService.get<AppConfigType>('app')!;
  }

  get database(): DatabaseConfigType {
    return this.configService.get<DatabaseConfigType>('database')!;
  }

  get redis(): RedisConfigType {
    return this.configService.get<RedisConfigType>('redis')!;
  }

  get storage(): StorageConfigType {
    return this.configService.get<StorageConfigType>('storage')!;
  }

  get ai(): AIConfigType {
    return this.configService.get<AIConfigType>('ai')!;
  }

  get monitoring(): MonitoringConfigType {
    return this.configService.get<MonitoringConfigType>('monitoring')!;
  }

  get security(): SecurityConfigType {
    return this.configService.get<SecurityConfigType>('security')!;
  }
}
