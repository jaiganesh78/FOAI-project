import { User } from '@prisma/client';

export interface UserWithRolesAndPermissions extends User {
  userRoles: {
    role: {
      id: string;
      name: string;
      rolePermissions: {
        permission: {
          id: string;
          action: string;
        };
      }[];
    };
  }[];
  identities: {
    id: string;
    provider: string;
    passwordHash: string | null;
  }[];
}

export interface IUserRepository {
  findById(id: string): Promise<UserWithRolesAndPermissions | null>;
  findByEmail(email: string): Promise<UserWithRolesAndPermissions | null>;
  incrementFailedLogin(userId: string, lockoutMinutes: number, maxAttempts: number): Promise<User>;
  resetFailedLogin(userId: string): Promise<User>;
  updateLastLogin(userId: string): Promise<User>;
  softDelete(userId: string): Promise<boolean>;
}
