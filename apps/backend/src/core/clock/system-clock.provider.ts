import { Injectable } from '@nestjs/common';
import { IClockProvider } from './clock.provider.interface';

@Injectable()
export class SystemClockProvider implements IClockProvider {
  now(): Date {
    return new Date();
  }

  isoString(): string {
    return new Date().toISOString();
  }

  timestampMs(): number {
    return Date.now();
  }
}
