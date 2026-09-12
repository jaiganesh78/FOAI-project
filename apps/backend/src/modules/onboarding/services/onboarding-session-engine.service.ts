import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ONBOARDING_SESSION_REPOSITORY } from '../../../core/tokens/injection-tokens';
import { IOnboardingSessionRepository } from '../repositories/onboarding-session.repository.interface';

@Injectable()
export class OnboardingSessionEngineService {
  constructor(
    @Inject(ONBOARDING_SESSION_REPOSITORY) private readonly sessionRepo: IOnboardingSessionRepository,
  ) {}

  async startOrResumeSession(userId: string): Promise<{ sessionId: string; status: string }> {
    let session = await this.sessionRepo.findByUserId(userId);
    if (!session) {
      session = await this.sessionRepo.createSession({
        userId,
        blueprintId: 'default-discovery-blueprint-v1',
        blueprintVersion: 1,
        currentStep: 'STEP_1',
        completedSteps: [],
        skippedSteps: [],
        status: 'STARTED' as any,
        updatedBy: userId,
      });
    } else if (session.status === 'PAUSED' || session.status === 'ABANDONED') {
      session = await this.sessionRepo.updateSession(session.id, {
        status: 'IN_PROGRESS' as any,
        updatedBy: userId,
      });
    }

    return {
      sessionId: session.id,
      status: session.status,
    };
  }

  async validateSessionOwnership(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new BadRequestException(`Onboarding session '${sessionId}' not found.`);
    }
    if (session.userId !== userId) {
      throw new BadRequestException(`Access Denied: Session '${sessionId}' does not belong to authenticated citizen.`);
    }
  }
}
