import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '@gpios/shared';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: (PermissionAction | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
