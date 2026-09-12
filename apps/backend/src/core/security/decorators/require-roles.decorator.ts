import { SetMetadata } from '@nestjs/common';
import { UserRoleType } from '@gpios/shared';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: (UserRoleType | string)[]) => SetMetadata(ROLES_KEY, roles);
