import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { ONBOARDING_SESSION_SERVICE } from '../../../core/tokens/injection-tokens';
import { OnboardingSessionService } from '../services/onboarding-session.service';
import {
  OnboardingSessionDto,
  OnboardingProgressDto,
  StepQuestionsDto,
  SubmitAnswerInputDto,
} from '@gpios/shared';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    @Inject(ONBOARDING_SESSION_SERVICE) private readonly sessionService: OnboardingSessionService,
  ) {}

  @Get('session')
  async getSession(@CurrentUser() user: AuthenticatedUserPayload): Promise<OnboardingSessionDto> {
    return this.sessionService.getOrCreateSession(user.id);
  }

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body('blueprintCode') blueprintCode?: string,
  ): Promise<OnboardingSessionDto> {
    return this.sessionService.getOrCreateSession(user.id, blueprintCode || 'DEFAULT_CITIZEN');
  }

  @Patch('session')
  async updateSessionStep(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body('stepKey') stepKey: string,
    @Body('action') action?: string,
  ): Promise<OnboardingSessionDto> {
    return this.sessionService.updateSessionStep(user.id, stepKey, action);
  }

  @Get('questions')
  async getQuestions(@CurrentUser() user: AuthenticatedUserPayload): Promise<StepQuestionsDto> {
    return this.sessionService.getQuestionsForCurrentStep(user.id);
  }

  @Post('answers')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SubmitAnswerInputDto,
  ): Promise<{ success: boolean; nextStep: string | null }> {
    return this.sessionService.submitAnswer(user.id, dto);
  }

  @Get('progress')
  async getProgress(@CurrentUser() user: AuthenticatedUserPayload): Promise<OnboardingProgressDto> {
    return this.sessionService.getProgress(user.id);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@CurrentUser() user: AuthenticatedUserPayload): Promise<OnboardingSessionDto> {
    return this.sessionService.completeOnboarding(user.id);
  }
}
