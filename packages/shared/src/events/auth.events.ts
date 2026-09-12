import { BaseDomainEventPayload } from './index';

export interface UserLoggedInEventPayload extends BaseDomainEventPayload {
  eventName: 'user.logged_in';
  userId: string;
  email: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserLoggedOutEventPayload extends BaseDomainEventPayload {
  eventName: 'user.logged_out';
  userId: string;
  sessionId: string;
}

export interface SessionCreatedEventPayload extends BaseDomainEventPayload {
  eventName: 'session.created';
  sessionId: string;
  userId: string;
}

export interface SessionRevokedEventPayload extends BaseDomainEventPayload {
  eventName: 'session.revoked';
  sessionId: string;
  userId: string;
  reason?: string;
}

export interface PasswordChangedEventPayload extends BaseDomainEventPayload {
  eventName: 'password.changed';
  userId: string;
}

export interface FailedLoginDetectedEventPayload extends BaseDomainEventPayload {
  eventName: 'auth.failed_login';
  email: string;
  userId?: string;
  ipAddress?: string;
  failureReason: string;
}
