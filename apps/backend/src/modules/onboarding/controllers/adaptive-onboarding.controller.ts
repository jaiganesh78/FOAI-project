import { Controller, Post, Get, Body, Param, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  ONBOARDING_SESSION_ENGINE_SERVICE,
  ADAPTIVE_QUESTION_ENGINE_SERVICE,
  ANSWER_PROCESSING_ENGINE_SERVICE,
  QUESTION_EXPLAINABILITY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { OnboardingSessionEngineService } from '../services/onboarding-session-engine.service';
import { AdaptiveQuestionEngineService } from '../services/adaptive-question-engine.service';
import { AnswerProcessingEngineService } from '../services/answer-processing-engine.service';
import { QuestionExplainabilityService } from '../services/question-explainability.service';
import { SubmitAnswerDto } from '@gpios/shared';

@Controller('api/v1/onboarding')
@UseGuards(JwtAuthGuard)
export class AdaptiveOnboardingController {
  constructor(
    @Inject(ONBOARDING_SESSION_ENGINE_SERVICE) private readonly sessionEngine: OnboardingSessionEngineService,
    @Inject(ADAPTIVE_QUESTION_ENGINE_SERVICE) private readonly adaptiveEngine: AdaptiveQuestionEngineService,
    @Inject(ANSWER_PROCESSING_ENGINE_SERVICE) private readonly answerEngine: AnswerProcessingEngineService,
    @Inject(QUESTION_EXPLAINABILITY_SERVICE) private readonly explainabilityService: QuestionExplainabilityService,
  ) {}

  @Post('start')
  async startOnboarding(@CurrentUser() user: any) {
    return this.sessionEngine.startOrResumeSession(user.id);
  }

  @Get('next-question')
  async getNextQuestion(@CurrentUser() user: any) {
    const question = await this.adaptiveEngine.getNextBestQuestion(user.id);
    return { question };
  }

  @Post('answer')
  async submitAnswer(@CurrentUser() user: any, @Body() dto: SubmitAnswerDto) {
    return this.answerEngine.processAnswer(user.id, dto);
  }

  @Get('question/:questionId/explain/:attributeKey')
  async explainQuestion(
    @CurrentUser() _user: any,
    @Param('questionId') questionId: string,
    @Param('attributeKey') attributeKey: string,
  ) {
    return this.explainabilityService.getExplanation(questionId, attributeKey);
  }
}
