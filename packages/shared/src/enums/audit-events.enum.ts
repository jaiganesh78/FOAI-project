export enum AuditEventType {
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',
  PASSWORD_CHANGED = 'password.changed',
  FAILED_LOGIN_DETECTED = 'auth.failed_login',
}
