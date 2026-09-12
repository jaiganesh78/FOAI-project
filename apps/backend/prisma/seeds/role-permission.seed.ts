import { PrismaClient } from '@prisma/client';
import { UserRoleType, PermissionAction } from '@gpios/shared';

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  // eslint-disable-next-line no-console
  console.log('Seeding system roles and permissions...');

  // 1. Define Permissions
  const permissionsList = [
    { action: PermissionAction.POLICY_READ, description: 'View and search government policies' },
    { action: PermissionAction.POLICY_CREATE, description: 'Ingest and define new policy documents' },
    { action: PermissionAction.POLICY_UPDATE, description: 'Edit existing policy rules' },
    { action: PermissionAction.POLICY_DELETE, description: 'Archive or remove policy rules' },
    { action: PermissionAction.KNOWLEDGE_PUBLISH, description: 'Publish knowledge fabric entries' },
    { action: PermissionAction.RECOMMENDATION_MANAGE, description: 'Configure policy recommendations' },
    { action: PermissionAction.USER_READ, description: 'View user profiles and sessions' },
    { action: PermissionAction.USER_MANAGE, description: 'Manage user roles and administrative accounts' },
    { action: PermissionAction.AUDIT_READ, description: 'View system audit trails and login history' },
  ];

  const dbPermissions = new Map<string, string>();
  for (const perm of permissionsList) {
    const created = await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: { action: perm.action, description: perm.description },
    });
    dbPermissions.set(perm.action, created.id);
  }

  // 2. Define System Roles & Role-Permission Matrix
  const rolesMatrix = [
    {
      name: UserRoleType.CITIZEN,
      description: 'Standard citizen user',
      permissions: [PermissionAction.POLICY_READ],
    },
    {
      name: UserRoleType.REVIEWER,
      description: 'Policy reviewer and compliance officer',
      permissions: [PermissionAction.POLICY_READ, PermissionAction.POLICY_CREATE, PermissionAction.POLICY_UPDATE],
    },
    {
      name: UserRoleType.ADMINISTRATOR,
      description: 'System administrator',
      permissions: [
        PermissionAction.POLICY_READ,
        PermissionAction.POLICY_CREATE,
        PermissionAction.POLICY_UPDATE,
        PermissionAction.POLICY_DELETE,
        PermissionAction.KNOWLEDGE_PUBLISH,
        PermissionAction.RECOMMENDATION_MANAGE,
        PermissionAction.USER_READ,
        PermissionAction.AUDIT_READ,
      ],
    },
    {
      name: UserRoleType.SUPER_ADMINISTRATOR,
      description: 'Super Administrator with unrestricted platform permissions',
      permissions: Object.values(PermissionAction),
    },
  ];

  for (const roleDef of rolesMatrix) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });

    for (const permAction of roleDef.permissions) {
      const permId = dbPermissions.get(permAction);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log('Role and Permission seeding completed successfully.');
}
