import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CITIZEN_PROFILE_REPOSITORY,
  CITIZEN_FACT_REPOSITORY,
  COMPLETENESS_ENGINE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { ICitizenProfileRepository } from '../repositories/citizen-profile.repository.interface';
import { ICitizenFactRepository } from '../repositories/citizen-fact.repository.interface';
import { CitizenCompletenessEngine } from './citizen-completeness.engine';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import { CitizenProfileResponseDto, DomainEventRegistry, ProfileStatus } from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class CitizenProfileService {
  constructor(
    @Inject(CITIZEN_PROFILE_REPOSITORY) private readonly profileRepository: ICitizenProfileRepository,
    @Inject(CITIZEN_FACT_REPOSITORY) private readonly factRepository: ICitizenFactRepository,
    @Inject(COMPLETENESS_ENGINE) private readonly completenessEngine: CitizenCompletenessEngine,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async getProfileByUserId(userId: string): Promise<CitizenProfileResponseDto> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException(`Citizen profile for user '${userId}' not found.`);
    }

    return {
      id: profile.id,
      userId: profile.userId,
      status: profile.status as ProfileStatus,
      completionPercentage: profile.completionPercentage,
      version: profile.version,
      factsCount: profile.facts ? profile.facts.length : 0,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async initializeProfile(userId: string): Promise<CitizenProfileResponseDto> {
    let profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      const created = await this.profileRepository.createProfile(userId);

      await this.eventPublisher.publish({
        eventId: randomUUID(),
        eventName: DomainEventRegistry.Citizen.ProfileCreated,
        eventVersion: '1.0',
        aggregateId: created.id,
        aggregateVersion: created.version,
        occurredOn: this.clockProvider.now(),
        occurredAt: this.clockProvider.now(),
        payload: { profileId: created.id, userId: created.userId, status: created.status },
      });

      profile = await this.profileRepository.findById(created.id);
    }

    return {
      id: profile!.id,
      userId: profile!.userId,
      status: profile!.status as ProfileStatus,
      completionPercentage: profile!.completionPercentage,
      version: profile!.version,
      factsCount: profile!.facts ? profile!.facts.length : 0,
      createdAt: profile!.createdAt.toISOString(),
      updatedAt: profile!.updatedAt.toISOString(),
    };
  }

  async recalculateAndSyncCompleteness(profileId: string): Promise<CitizenProfileResponseDto> {
    const activeFacts = await this.factRepository.findActiveByProfileId(profileId);
    const { status, completenessDto } = await this.completenessEngine.calculateCompleteness(profileId, activeFacts);

    const updated = await this.profileRepository.updateStatusAndCompleteness(
      profileId,
      status,
      completenessDto.completionPercentage,
    );

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Citizen.ProfileUpdated,
      eventVersion: '1.0',
      aggregateId: updated.id,
      aggregateVersion: updated.version,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        profileId: updated.id,
        userId: updated.userId,
        status: updated.status,
        completionPercentage: updated.completionPercentage,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      status: updated.status as ProfileStatus,
      completionPercentage: updated.completionPercentage,
      version: updated.version,
      factsCount: activeFacts.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
