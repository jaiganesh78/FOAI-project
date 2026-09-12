import {
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  AUDIT_REPOSITORY,
  EVENT_PUBLISHER,
  CLOCK_PROVIDER,
} from '../../../core/tokens/injection-tokens';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ISessionRepository } from '../repositories/session.repository.interface';
import { IAuditRepository } from '../repositories/audit.repository.interface';
import { IEventPublisher } from '../../../core/event-bus/event-publisher.interface';
import { IClockProvider } from '../../../core/clock/clock.provider.interface';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { ConfigService } from '../../../core/config/config.service';
import { UserStatus } from '@prisma/client';
import {
  AuthResponseDto,
  UserPayloadDto,
  SessionItemDto,
  AuditEventType,
} from '@gpios/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: IAuditRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
    @Inject(CLOCK_PROVIDER) private readonly clockProvider: IClockProvider,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  async login(
    email: string,
    pass: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string,
  ): Promise<AuthResponseDto> {
    const secConfig = this.configService.security;
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await this.auditRepository.logAuthEvent({
        email,
        status: AuditEventType.FAILED_LOGIN_DETECTED,
        ipAddress,
        userAgent,
        requestId,
        failureReason: 'User not found',
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Check Account Status & Lockout
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended. Please contact support.');
    }

    if (user.status === UserStatus.LOCKED && user.accountLockedUntil) {
      if (user.accountLockedUntil > this.clockProvider.now()) {
        throw new ForbiddenException(
          `Account locked due to multiple failed login attempts. Try again after ${user.accountLockedUntil.toISOString()}`,
        );
      }
    }

    // Find Local Identity
    const localIdentity = user.identities.find((id) => id.provider === 'LOCAL');
    if (!localIdentity || !localIdentity.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Verify Password Hash
    const isPasswordValid = await this.passwordService.verify(localIdentity.passwordHash, pass);
    if (!isPasswordValid) {
      await this.userRepository.incrementFailedLogin(
        user.id,
        secConfig.accountLockoutDurationMinutes,
        secConfig.maxLoginAttempts,
      );
      await this.auditRepository.logAuthEvent({
        userId: user.id,
        email,
        status: AuditEventType.FAILED_LOGIN_DETECTED,
        ipAddress,
        userAgent,
        requestId,
        failureReason: 'Invalid password',
      });
      await this.eventPublisher.publish({
        eventId: randomUUID(),
        eventName: 'auth.failed_login',
        occurredOn: this.clockProvider.now(),
        aggregateId: user.id,
        payload: { email, userId: user.id, failureReason: 'Invalid password' },
      });

      throw new UnauthorizedException('Invalid credentials.');
    }

    // Successful Credentials: Reset counters
    await this.userRepository.resetFailedLogin(user.id);
    await this.userRepository.updateLastLogin(user.id);

    // Extract Roles & Permissions
    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.name)));
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.action),
        ),
      ),
    );

    // Create Refresh Session
    const sessionId = randomUUID();
    const refreshToken = this.tokenService.generateRefreshToken(user.id, sessionId);
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);

    const refreshExpMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    await this.sessionRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshExpMs),
      ipAddress,
      userAgent,
    });

    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, roles, permissions);

    await this.auditRepository.logAuthEvent({
      userId: user.id,
      email: user.email,
      status: AuditEventType.USER_LOGGED_IN,
      ipAddress,
      userAgent,
      requestId,
    });

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: 'user.logged_in',
      occurredOn: this.clockProvider.now(),
      aggregateId: user.id,
      payload: { userId: user.id, email: user.email, sessionId },
    });

    const userPayload: UserPayloadDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles,
      permissions,
    };

    return {
      user: userPayload,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    };
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);

    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    // Token Reuse Detection / Revocation
    if (!session || session.isRevoked) {
      this.logger.warn(`Potential refresh token reuse attack detected for user ${payload.sub}`);
      await this.sessionRepository.revokeAllSessionsForUser(payload.sub);
      await this.auditRepository.logAuthEvent({
        userId: payload.sub,
        email: 'unknown',
        status: AuditEventType.SESSION_REVOKED,
        ipAddress,
        userAgent,
        failureReason: 'Refresh token reuse attack detected - all sessions revoked',
      });
      throw new UnauthorizedException('Refresh token security breach detected. All sessions revoked.');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is locked or inactive.');
    }

    // Rotate Refresh Token: Revoke current session
    const newSessionId = randomUUID();
    const newRefreshToken = this.tokenService.generateRefreshToken(user.id, newSessionId);
    const newTokenHash = this.tokenService.hashRefreshToken(newRefreshToken);

    await this.sessionRepository.revokeSession(session.id, newSessionId);

    const refreshExpMs = 7 * 24 * 60 * 60 * 1000;
    await this.sessionRepository.createSession({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + refreshExpMs),
      ipAddress,
      userAgent,
    });

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.name)));
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.action),
        ),
      ),
    );

    const accessToken = this.tokenService.generateAccessToken(user.id, user.email, roles, permissions);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
      const session = await this.sessionRepository.findByTokenHash(tokenHash);
      if (session) {
        await this.sessionRepository.revokeSession(session.id);
      }
    } else {
      await this.sessionRepository.revokeAllSessionsForUser(userId);
    }

    await this.auditRepository.logAuthEvent({
      userId,
      email: 'user',
      status: AuditEventType.USER_LOGGED_OUT,
    });

    await this.eventPublisher.publish({
      eventId: randomUUID(),
      eventName: 'user.logged_out',
      occurredOn: this.clockProvider.now(),
      aggregateId: userId,
      payload: { userId },
    });
  }

  async getCurrentUser(userId: string): Promise<UserPayloadDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.name)));
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.action),
        ),
      ),
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      roles,
      permissions,
    };
  }

  async getUserSessions(userId: string, currentRefreshToken?: string): Promise<SessionItemDto[]> {
    const sessions = await this.sessionRepository.findActiveByUserId(userId);
    const currentHash = currentRefreshToken ? this.tokenService.hashRefreshToken(currentRefreshToken) : null;

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName || 'Unknown Device',
      platform: s.platform || 'Unknown OS',
      browser: s.browser || 'Unknown Browser',
      operatingSystem: s.operatingSystem || 'Unknown',
      ipAddress: s.ipAddress || '0.0.0.0',
      lastActivityAt: s.lastActivityAt.toISOString(),
      isCurrent: currentHash ? s.tokenHash === currentHash : false,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async revokeSession(userId: string, targetSessionId: string): Promise<void> {
    await this.sessionRepository.softDelete(targetSessionId);
    await this.auditRepository.logAuthEvent({
      userId,
      email: 'user',
      status: AuditEventType.SESSION_REVOKED,
      failureReason: `Session ${targetSessionId} manually revoked`,
    });
  }
}
