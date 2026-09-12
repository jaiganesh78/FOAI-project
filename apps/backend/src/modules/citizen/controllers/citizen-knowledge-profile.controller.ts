import { Controller, Get, Param, ParseIntPipe, UseGuards, Inject, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  CITIZEN_KNOWLEDGE_PROFILE_SERVICE,
  PROFILE_SNAPSHOT_REPLAY_SERVICE,
  FACT_VERSION_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { CitizenKnowledgeProfileService } from '../services/citizen-knowledge-profile.service';
import { ProfileSnapshotReplayService } from '../services/profile-snapshot-replay.service';
import { FactVersionService } from '../services/fact-version.service';

@Controller('api/v1/citizen-profile')
@UseGuards(JwtAuthGuard)
export class CitizenKnowledgeProfileController {
  constructor(
    @Inject(CITIZEN_KNOWLEDGE_PROFILE_SERVICE) private readonly profileService: CitizenKnowledgeProfileService,
    @Inject(PROFILE_SNAPSHOT_REPLAY_SERVICE) private readonly snapshotReplayService: ProfileSnapshotReplayService,
    @Inject(FACT_VERSION_SERVICE) private readonly factVersionService: FactVersionService,
  ) {}

  @Get('facts')
  async getProfileFacts(@CurrentUser() user: any) {
    return this.profileService.getProfileFacts(user.id);
  }

  @Get('completeness')
  async getCompleteness(@CurrentUser() user: any) {
    return this.profileService.getCompletenessBreakdown(user.id);
  }

  @Get('facts/:factId/versions')
  async getFactVersions(@CurrentUser() _user: any, @Param('factId') factId: string) {
    return this.factVersionService.getHistory(factId);
  }

  @Get('snapshots/:versionNumber/replay')
  async replaySnapshot(
    @CurrentUser() user: any,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    const result = await this.snapshotReplayService.replaySnapshot(user.id, versionNumber);
    if (result.snapshot.profileId !== user.id) {
      throw new ForbiddenException('Access Denied: Cannot replay profile snapshot of another citizen.');
    }
    return result;
  }
}
