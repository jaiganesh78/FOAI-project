import { Injectable } from '@nestjs/common';
import { KnowledgeSource } from '@prisma/client';

@Injectable()
export class RefreshSchedulerService {
  calculateNextRunTime(source: KnowledgeSource): Date {
    const now = new Date();
    // Adaptive interval logic based on source code / type
    let intervalMinutes = 60 * 24; // Default daily

    if (source.code.includes('BUDGET')) {
      intervalMinutes = 60; // Hourly during budget session
    } else if (source.code.includes('GAZETTE')) {
      intervalMinutes = 60 * 24; // Daily
    } else if (source.code.includes('SCHOLARSHIP')) {
      intervalMinutes = 60 * 6; // Every 6 hours
    } else if (source.code.includes('PM_KISAN')) {
      intervalMinutes = 60 * 24 * 30; // Monthly
    }

    return new Date(now.getTime() + intervalMinutes * 60 * 1000);
  }
}
