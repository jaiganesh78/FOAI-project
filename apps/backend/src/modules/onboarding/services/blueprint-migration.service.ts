import { Injectable, Logger } from '@nestjs/common';

export interface IBlueprintMigrationService {
  canMigrate(currentBlueprintVersion: number, targetBlueprintVersion: number): boolean;
  migrateSession(sessionId: string, targetBlueprintId: string): Promise<boolean>;
}

@Injectable()
export class BlueprintMigrationService implements IBlueprintMigrationService {
  private readonly logger = new Logger(BlueprintMigrationService.name);

  canMigrate(currentBlueprintVersion: number, targetBlueprintVersion: number): boolean {
    return targetBlueprintVersion > currentBlueprintVersion;
  }

  async migrateSession(sessionId: string, targetBlueprintId: string): Promise<boolean> {
    this.logger.log(`Placeholder Blueprint migration for session ${sessionId} to ${targetBlueprintId}`);
    return true;
  }
}
