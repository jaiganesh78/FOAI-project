import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IUserRepository, UserWithRolesAndPermissions } from './user.repository.interface';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithRolesAndPermissions | null> {
    return (await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        identities: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as UserWithRolesAndPermissions | null;
  }

  async findByEmail(email: string): Promise<UserWithRolesAndPermissions | null> {
    return (await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        identities: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as UserWithRolesAndPermissions | null;
  }

  async incrementFailedLogin(userId: string, lockoutMinutes: number, maxAttempts: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User with ID ${userId} not found`);

    const newFailedCount = user.failedLoginCount + 1;
    let newStatus = user.status;
    let lockUntil: Date | null = user.accountLockedUntil;

    if (newFailedCount >= maxAttempts) {
      newStatus = UserStatus.LOCKED;
      lockUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: newFailedCount,
        status: newStatus,
        accountLockedUntil: lockUntil,
        version: { increment: 1 },
      },
    });
  }

  async resetFailedLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        status: UserStatus.ACTIVE,
        accountLockedUntil: null,
        version: { increment: 1 },
      },
    });
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  async softDelete(userId: string): Promise<boolean> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
    return true;
  }
}
