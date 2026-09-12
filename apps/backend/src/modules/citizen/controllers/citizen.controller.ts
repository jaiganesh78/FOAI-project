import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController } from '../../../core/common/base.controller';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { CitizenProfileService } from '../services/citizen-profile.service';
import { CitizenFactService } from '../services/citizen-fact.service';
import { CITIZEN_QUERY_SERVICE } from '../../../core/tokens/injection-tokens';
import { ICitizenQueryService } from '../services/citizen-query.service';
import { CreateCitizenFactInputDto, UpdateCitizenFactInputDto } from '@gpios/shared';

@ApiTags('Citizen Intelligence Foundation')
@Controller('citizen')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CitizenController extends BaseController {
  constructor(
    @Inject(CitizenProfileService) private readonly profileService: CitizenProfileService,
    @Inject(CitizenFactService) private readonly factService: CitizenFactService,
    @Inject(CITIZEN_QUERY_SERVICE) private readonly queryService: ICitizenQueryService,
  ) {
    super(CitizenController.name);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile summary for authenticated citizen' })
  @ApiResponse({ status: 200, description: 'Profile summary retrieved successfully.' })
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.profileService.getProfileByUserId(userId);
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize new citizen profile' })
  @ApiResponse({ status: 201, description: 'Profile initialized successfully.' })
  async createProfile(@CurrentUser('sub') userId: string) {
    return this.profileService.initializeProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Recalculate and update profile completion percentage' })
  @ApiResponse({ status: 200, description: 'Profile recalculated successfully.' })
  async updateProfile(@CurrentUser('sub') userId: string) {
    const profile = await this.profileService.getProfileByUserId(userId);
    return this.profileService.recalculateAndSyncCompleteness(profile.id);
  }

  @Get('facts')
  @ApiOperation({ summary: 'List all verified active facts for authenticated citizen' })
  @ApiResponse({ status: 200, description: 'Citizen facts retrieved successfully.' })
  async getFacts(@CurrentUser('sub') userId: string) {
    return this.factService.getFactsForUser(userId);
  }

  @Post('facts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add or upsert a citizen fact (validated against Master Attribute Registry)' })
  @ApiResponse({ status: 201, description: 'Fact added successfully.' })
  async addFact(@CurrentUser('sub') userId: string, @Body() dto: CreateCitizenFactInputDto) {
    return this.factService.addFactForUser(userId, dto);
  }

  @Patch('facts/:id')
  @ApiOperation({ summary: 'Update existing fact value (creates historic version snapshot)' })
  @ApiResponse({ status: 200, description: 'Fact updated successfully.' })
  async updateFact(
    @CurrentUser('sub') userId: string,
    @Param('id') factId: string,
    @Body() dto: UpdateCitizenFactInputDto,
  ) {
    return this.factService.updateFactForUser(userId, factId, dto);
  }

  @Delete('facts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a citizen fact' })
  @ApiResponse({ status: 200, description: 'Fact deleted successfully.' })
  async deleteFact(@CurrentUser('sub') userId: string, @Param('id') factId: string) {
    await this.factService.deleteFactForUser(userId, factId);
    return { message: `Fact '${factId}' soft deleted successfully.` };
  }

  @Get('profile/completeness')
  @ApiOperation({ summary: 'Get profile completeness calculation, missing categories, and mandatory attributes' })
  @ApiResponse({ status: 200, description: 'Completeness summary retrieved successfully.' })
  async getCompleteness(@CurrentUser('sub') userId: string) {
    return this.queryService.getCompletenessSummary(userId);
  }
}
