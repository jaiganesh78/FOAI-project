import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CITIZEN_PROFILE_REPOSITORY,
  CITIZEN_FACT_REPOSITORY,
  ATTRIBUTE_VALIDATION_ENGINE,
  SNAPSHOT_SERVICE,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { ICitizenProfileRepository } from '../repositories/citizen-profile.repository.interface';
import { ICitizenFactRepository, CitizenFactWithAttribute } from '../repositories/citizen-fact.repository.interface';
import { AttributeValidationEngine } from './attribute-validation.engine';
import { CitizenSnapshotService } from './citizen-snapshot.service';
import { CitizenProfileService } from './citizen-profile.service';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import {
  CitizenFactResponseDto,
  CreateCitizenFactInputDto,
  UpdateCitizenFactInputDto,
  DomainEventRegistry,
  FactCategory,
  AttributeDataType,
  VerificationStatus,
  CreationMethod,
  ConfidenceSource,
} from '@gpios/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class CitizenFactService {
  constructor(
    @Inject(CITIZEN_PROFILE_REPOSITORY) private readonly profileRepository: ICitizenProfileRepository,
    @Inject(CITIZEN_FACT_REPOSITORY) private readonly factRepository: ICitizenFactRepository,
    @Inject(ATTRIBUTE_VALIDATION_ENGINE) private readonly validationEngine: AttributeValidationEngine,
    @Inject(SNAPSHOT_SERVICE) private readonly snapshotService: CitizenSnapshotService,
    @Inject(CitizenProfileService) private readonly profileService: CitizenProfileService,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
  ) {}

  async getFactsForUser(userId: string): Promise<CitizenFactResponseDto[]> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      return [];
    }

    const facts = await this.factRepository.findActiveByProfileId(profile.id);
    return facts.map((f) => this.mapToFactResponseDto(f));
  }

  async addFactForUser(userId: string, dto: CreateCitizenFactInputDto): Promise<CitizenFactResponseDto> {
    let profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      await this.profileService.initializeProfile(userId);
      profile = await this.profileRepository.findByUserId(userId);
    }

    const profileId = profile!.id;

    // Validate Attribute against Registry & Dependencies
    const { attribute, typedValue } = await this.validationEngine.validateAndFormat(
      dto.attributeKey,
      dto.value,
      profileId,
      this.factRepository,
    );

    const fact = await this.factRepository.upsertFact({
      profileId,
      attributeKey: attribute.key,
      valueText: typedValue.valueText,
      valueNumber: typedValue.valueNumber,
      valueBoolean: typedValue.valueBoolean,
      valueDate: typedValue.valueDate,
      valueJson: typedValue.valueJson,
      confidence: dto.confidence,
      confidenceSource: dto.confidenceSource,
      verificationStatus: dto.verificationStatus,
      creationMethod: dto.creationMethod,
      createdBy: userId,
      evidenceId: dto.evidenceId,
    });

    // Recalculate Completeness & Sync Profile State
    const updatedProfile = await this.profileService.recalculateAndSyncCompleteness(profileId);
    const activeFacts = await this.factRepository.findActiveByProfileId(profileId);

    // Create Immutable Point-in-time Snapshot
    await this.snapshotService.generateSnapshot(
      profileId,
      userId,
      updatedProfile.version,
      updatedProfile.status,
      updatedProfile.completionPercentage,
      activeFacts,
      `Added/Updated fact '${attribute.key}'`,
    );

    // Publish Event
    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Citizen.FactAdded,
      eventVersion: '1.0',
      aggregateId: fact.id,
      aggregateVersion: fact.version,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        factId: fact.id,
        profileId,
        attributeKey: attribute.key,
        category: attribute.category,
        value: dto.value,
        confidence: fact.confidence,
      },
    });

    const fullFact = await this.factRepository.findById(fact.id);
    return this.mapToFactResponseDto(fullFact!);
  }

  async updateFactForUser(userId: string, factId: string, dto: UpdateCitizenFactInputDto): Promise<CitizenFactResponseDto> {
    const existing = await this.factRepository.findById(factId);
    if (!existing) {
      throw new NotFoundException(`Citizen fact '${factId}' not found.`);
    }

    const { attribute, typedValue } = await this.validationEngine.validateAndFormat(
      existing.attributeKey,
      dto.value,
      existing.profileId,
      this.factRepository,
    );

    const updatedFact = await this.factRepository.updateFact(factId, {
      valueText: typedValue.valueText,
      valueNumber: typedValue.valueNumber,
      valueBoolean: typedValue.valueBoolean,
      valueDate: typedValue.valueDate,
      valueJson: typedValue.valueJson,
      confidence: dto.confidence,
      verificationStatus: dto.verificationStatus,
      changeReason: dto.changeReason,
      changedBy: userId,
    });

    const updatedProfile = await this.profileService.recalculateAndSyncCompleteness(existing.profileId);
    const activeFacts = await this.factRepository.findActiveByProfileId(existing.profileId);

    await this.snapshotService.generateSnapshot(
      existing.profileId,
      userId,
      updatedProfile.version,
      updatedProfile.status,
      updatedProfile.completionPercentage,
      activeFacts,
      `Updated fact '${attribute.key}'`,
    );

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Citizen.FactUpdated,
      eventVersion: '1.0',
      aggregateId: updatedFact.id,
      aggregateVersion: updatedFact.version,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        factId: updatedFact.id,
        profileId: existing.profileId,
        attributeKey: attribute.key,
        previousValue: existing.valueBoolean ?? existing.valueNumber ?? existing.valueText ?? existing.valueJson,
        newValue: dto.value,
        version: updatedFact.version,
      },
    });

    const fullFact = await this.factRepository.findById(updatedFact.id);
    return this.mapToFactResponseDto(fullFact!);
  }

  async deleteFactForUser(_userId: string, factId: string): Promise<void> {
    const existing = await this.factRepository.findById(factId);
    if (!existing) {
      throw new NotFoundException(`Citizen fact '${factId}' not found.`);
    }

    await this.factRepository.softDeleteFact(factId);
    await this.profileService.recalculateAndSyncCompleteness(existing.profileId);

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: DomainEventRegistry.Citizen.FactDeleted,
      eventVersion: '1.0',
      aggregateId: factId,
      aggregateVersion: existing.version + 1,
      occurredOn: this.clockProvider.now(),
      occurredAt: this.clockProvider.now(),
      payload: {
        factId,
        profileId: existing.profileId,
        attributeKey: existing.attributeKey,
      },
    });
  }

  private mapToFactResponseDto(fact: CitizenFactWithAttribute): CitizenFactResponseDto {
    const rawVal =
      fact.valueBoolean !== null && fact.valueBoolean !== undefined
        ? fact.valueBoolean
        : fact.valueNumber !== null && fact.valueNumber !== undefined
        ? fact.valueNumber
        : fact.valueDate !== null && fact.valueDate !== undefined
        ? fact.valueDate.toISOString()
        : fact.valueText !== null && fact.valueText !== undefined
        ? fact.valueText
        : fact.valueJson;

    return {
      id: fact.id,
      attributeKey: fact.attributeKey,
      displayName: fact.attribute.displayName,
      category: fact.attribute.category as FactCategory,
      dataType: fact.attribute.dataType as AttributeDataType,
      value: rawVal,
      confidence: fact.confidence,
      confidenceSource: fact.confidenceSource as ConfidenceSource,
      verificationStatus: fact.verificationStatus as VerificationStatus,
      creationMethod: fact.creationMethod as CreationMethod,
      createdBy: fact.createdBy,
      evidenceId: fact.evidenceId,
      version: fact.version,
      updatedAt: fact.updatedAt.toISOString(),
    };
  }
}
