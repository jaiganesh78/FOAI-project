import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { RolesGuard } from '../../../src/core/security/guards/roles.guard';
import { PermissionsGuard } from '../../../src/core/security/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionAction, UserRoleType } from '@gpios/shared';

describe('RBAC Authorization Guards (Integration Tests)', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let permissionsGuard: PermissionsGuard;

  beforeAll(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    permissionsGuard = new PermissionsGuard(reflector);
  });

  const createMockContext = (roles: string[], permissions: string[]): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'test-user-123',
            roles,
            permissions,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('RolesGuard should allow user with matching role', () => {
    reflector.getAllAndOverride = () => [UserRoleType.ADMINISTRATOR];
    const context = createMockContext([UserRoleType.ADMINISTRATOR], []);

    expect(rolesGuard.canActivate(context)).toBe(true);
  });

  it('RolesGuard should deny user missing required role', () => {
    reflector.getAllAndOverride = () => [UserRoleType.SUPER_ADMINISTRATOR];
    const context = createMockContext([UserRoleType.CITIZEN], []);

    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('PermissionsGuard should allow user possessing all required permissions', () => {
    reflector.getAllAndOverride = () => [PermissionAction.POLICY_READ, PermissionAction.POLICY_CREATE];
    const context = createMockContext(
      [],
      [PermissionAction.POLICY_READ, PermissionAction.POLICY_CREATE, PermissionAction.USER_READ],
    );

    expect(permissionsGuard.canActivate(context)).toBe(true);
  });

  it('PermissionsGuard should deny user missing required permission', () => {
    reflector.getAllAndOverride = () => [PermissionAction.POLICY_DELETE];
    const context = createMockContext([], [PermissionAction.POLICY_READ]);

    expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
  });
});
