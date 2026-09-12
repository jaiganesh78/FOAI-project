import { Role, Permission } from '@prisma/client';

export interface RoleWithPermissions extends Role {
  rolePermissions: {
    permission: Permission;
  }[];
}

export interface IRoleRepository {
  findByName(name: string): Promise<RoleWithPermissions | null>;
  findAll(): Promise<RoleWithPermissions[]>;
  softDelete(roleId: string): Promise<boolean>;
}
