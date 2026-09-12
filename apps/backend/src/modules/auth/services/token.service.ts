import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { ConfigService } from '../../../core/config/config.service';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
}

@Injectable()
export class TokenService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  generateAccessToken(userId: string, email: string, roles: string[], permissions: string[]): string {
    const sec = this.configService.security;
    const payload: JwtAccessPayload = {
      sub: userId,
      email,
      roles,
      permissions,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      secret: sec.jwtAccessSecret,
      expiresIn: sec.jwtAccessExpiration as `${number}${'s'|'m'|'h'|'d'}`,
      issuer: sec.jwtIssuer,
      audience: sec.jwtAudience,
    });
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    const sec = this.configService.security;
    const payload: JwtRefreshPayload = {
      sub: userId,
      sessionId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: sec.jwtRefreshSecret,
      expiresIn: sec.jwtRefreshExpiration as `${number}${'s'|'m'|'h'|'d'}`,
      issuer: sec.jwtIssuer,
      audience: sec.jwtAudience,
    });
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    const sec = this.configService.security;
    try {
      return this.jwtService.verify<JwtAccessPayload>(token, {
        secret: sec.jwtAccessSecret,
        issuer: sec.jwtIssuer,
        audience: sec.jwtAudience,
        clockTolerance: sec.jwtClockSkewSeconds,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    const sec = this.configService.security;
    try {
      return this.jwtService.verify<JwtRefreshPayload>(token, {
        secret: sec.jwtRefreshSecret,
        issuer: sec.jwtIssuer,
        audience: sec.jwtAudience,
        clockTolerance: sec.jwtClockSkewSeconds,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }
}
