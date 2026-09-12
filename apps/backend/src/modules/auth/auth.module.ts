import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { PrismaAuditRepository } from './repositories/prisma-audit.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { JwtAuthGuard } from '../../core/security/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/security/guards/roles.guard';
import { PermissionsGuard } from '../../core/security/guards/permissions.guard';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  AUDIT_REPOSITORY,
  ROLE_REPOSITORY,
  PASSWORD_HASHER,
  AUTH_SERVICE,
} from '../../core/tokens/injection-tokens';

@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    PasswordService,
    TokenService,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useClass: PrismaSessionRepository,
    },
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: PasswordService,
    },
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    USER_REPOSITORY,
    SESSION_REPOSITORY,
    AUDIT_REPOSITORY,
    ROLE_REPOSITORY,
    AUTH_SERVICE,
  ],
})
export class AuthModule {}
