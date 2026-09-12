import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '../../../core/config/config.service';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plainText: string): Promise<boolean>;
}

@Injectable()
export class PasswordService implements IPasswordHasher {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    const sec = this.configService.security;
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: sec.argon2MemoryCostKb,
      timeCost: sec.argon2TimeCost,
      parallelism: sec.argon2Parallelism,
    });
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }
}
