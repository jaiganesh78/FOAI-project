import {
  Controller,
  Post,
  Body,
  UseGuards,
  Inject,
  Optional,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import {
  CANDIDATE_RETRIEVAL_SERVICE,
  CITIZEN_QUERY_SERVICE,
} from '../../../core/tokens/injection-tokens';
import { CandidateRetrievalService } from '../services/candidate-retrieval.service';
import { CitizenQueryService } from '../../citizen/services/citizen-query.service';
import {
  CandidateRetrievalRequest,
  CandidateRetrievalResult,
  candidateRetrievalRequestSchema,
} from '@gpios/shared';

@Controller('candidate-retrieval')
@UseGuards(JwtAuthGuard)
export class CandidateRetrievalController {
  constructor(
    @Inject(CANDIDATE_RETRIEVAL_SERVICE)
    private readonly retrievalService: CandidateRetrievalService,
    @Optional()
    @Inject(CITIZEN_QUERY_SERVICE)
    private readonly citizenQueryService?: CitizenQueryService,
  ) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchCandidates(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ): Promise<CandidateRetrievalResult> {
    const parseResult = candidateRetrievalRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Invalid candidate retrieval request payload',
        errors: parseResult.error.flatten(),
      });
    }

    const validRequest = parseResult.data as CandidateRetrievalRequest;

    // Trust Boundary & Ownership Verification (Finding R4):
    // 1. Prevent cross-citizen identity spoofing
    if (validRequest.citizenContext.userId && user?.userId && validRequest.citizenContext.userId !== user.userId) {
      throw new ForbiddenException('Cross-citizen access forbidden: user cannot retrieve candidates for another citizen');
    }

    // 2. Structural Trust Boundary Separation (H1):
    // Server-side authoritative facts loaded strictly from CitizenQueryService
    const effectiveUserId = user?.userId || validRequest.citizenContext.userId;
    let authoritativeCitizenFacts: Record<string, unknown> = {};

    if (effectiveUserId && this.citizenQueryService) {
      try {
        const loaded = await this.citizenQueryService.getStructuredFactsByUserId(effectiveUserId);
        if (loaded && typeof loaded === 'object') {
          authoritativeCitizenFacts = loaded;
        }
      } catch (err) {
        // Query failure: server authoritative facts remain empty; does not promote client hints to authority
      }
    }

    // Client-provided values are strictly mapped to exploratory retrievalHints.
    // They are NEVER passed as authoritativeCitizenFacts.
    const clientHints = {
      ...(validRequest.citizenContext.retrievalHints || {}),
      ...(validRequest.citizenContext.facts || {}),
    };

    const effectiveRequest: CandidateRetrievalRequest = {
      ...validRequest,
      citizenContext: {
        userId: effectiveUserId,
        authoritativeCitizenFacts,
        retrievalHints: clientHints,
      },
    };

    return this.retrievalService.retrieveCandidates(effectiveRequest);
  }
}
