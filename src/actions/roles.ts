"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RoleDefinition } from "@prisma/client";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function getRoles(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { 
      userId: user.id,
      organizationId 
    }
  });

  if (!membership) throw new Error("Nemáte přístup k této organizaci.");

  // Everyone should be able to see roles (needed for user role assignment)
  return await prisma.roleDefinition.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createRole(data: {
  organizationId: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission strings
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const canManageRoles = await hasPermission(user.id, data.organizationId, "manage_roles");
  if (!canManageRoles) {
    throw new Error("Nemáte oprávnění spravovat role.");
  }

  const role = await prisma.roleDefinition.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      permissions: JSON.stringify(data.permissions),
    },
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function updateRole(id: string, data: {
  name?: string;
  description?: string;
  permissions?: string[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const existingRole = await prisma.roleDefinition.findUnique({ where: { id } });
  if (!existingRole) throw new Error("Role not found");

  const canManageRoles = await hasPermission(user.id, existingRole.organizationId, "manage_roles");
  if (!canManageRoles) {
    throw new Error("Nemáte oprávnění spravovat role.");
  }

  const updateData: any = { ...data };
  if (data.permissions) {
    updateData.permissions = JSON.stringify(data.permissions);
  }

  const role = await prisma.roleDefinition.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/settings/roles");
  return role;
}

export async function deleteRole(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const existingRole = await prisma.roleDefinition.findUnique({ where: { id } });
  if (!existingRole) throw new Error("Role not found");

  const canManageRoles = await hasPermission(user.id, existingRole.organizationId, "manage_roles");
  if (!canManageRoles) {
    throw new Error("Nemáte oprávnění spravovat role.");
  }

  await prisma.roleDefinition.delete({
    where: { id },
  });
  revalidatePath("/settings/roles");
}

export async function cloneRole(sourceRoleId: string, newName: string, organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");
  
  const canManageRoles = await hasPermission(user.id, organizationId, "manage_roles");
  if (!canManageRoles) {
    throw new Error("Nemáte oprávnění spravovat role.");
  }

  const sourceRole = await prisma.roleDefinition.findUnique({
    where: { id: sourceRoleId },
  });

  if (!sourceRole) throw new Error("Source role not found");

  const newRole = await prisma.roleDefinition.create({
    data: {
      organizationId,
      name: newName,
      description: `Cloned from ${sourceRole.name}`,
      permissions: sourceRole.permissions, // Copy permissions JSON directly
    },
  });

  revalidatePath("/settings/roles");
  return newRole;
}
