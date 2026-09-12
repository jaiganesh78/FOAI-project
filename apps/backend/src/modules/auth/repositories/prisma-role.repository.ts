import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { IRoleRepository, RoleWithPermissions } from './role.repository.interface';

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByName(name: string): Promise<RoleWithPermissions | null> {
    return (await this.prisma.role.findFirst({
      where: { name, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })) as RoleWithPermissions | null;
  }

  async findAll(): Promise<RoleWithPermissions[]> {
    return (await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    })) as RoleWithPermissions[];
  }

  async softDelete(roleId: string): Promise<boolean> {
    await this.prisma.role.update({
      where: { id: roleId },
      data: { deletedAt: new Date() },
    });
    return true;
  }
}
