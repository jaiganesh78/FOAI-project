import { StandardDomainEventEnvelope } from './domain-event.registry';

export interface CitizenProfileCreatedPayload {
  profileId: string;
  userId: string;
  status: string;
}

export interface CitizenProfileUpdatedPayload {
  profileId: string;
  userId: string;
  status: string;
  completionPercentage: number;
}

export interface CitizenFactAddedPayload {
  factId: string;
  profileId: string;
  attributeKey: string;
  category: string;
  value: unknown;
  confidence: number;
}

export interface CitizenFactUpdatedPayload {
  factId: string;
  profileId: string;
  attributeKey: string;
  previousValue: unknown;
  newValue: unknown;
  version: number;
}

export interface CitizenFactDeletedPayload {
  factId: string;
  profileId: string;
  attributeKey: string;
}

export interface CitizenProfileVersionCreatedPayload {
  profileId: string;
  versionNumber: number;
  changeSummary?: string;
}

export type CitizenProfileCreatedEvent = StandardDomainEventEnvelope<CitizenProfileCreatedPayload>;
export type CitizenProfileUpdatedEvent = StandardDomainEventEnvelope<CitizenProfileUpdatedPayload>;
export type CitizenFactAddedEvent = StandardDomainEventEnvelope<CitizenFactAddedPayload>;
export type CitizenFactUpdatedEvent = StandardDomainEventEnvelope<CitizenFactUpdatedPayload>;
export type CitizenFactDeletedEvent = StandardDomainEventEnvelope<CitizenFactDeletedPayload>;
export type CitizenProfileVersionCreatedEvent = StandardDomainEventEnvelope<CitizenProfileVersionCreatedPayload>;
