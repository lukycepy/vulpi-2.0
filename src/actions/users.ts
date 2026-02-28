"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@/types"; // We might need to import Role enum from prisma or types
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function getOrganizationUsers(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { 
      userId: user.id,
      organizationId 
    }
  });

  if (!membership) throw new Error("Nemáte přístup k této organizaci.");
  
  return await prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: true,
      roleDefinition: true,
    },
    orderBy: { user: { email: "asc" } },
  });
}

export async function updateUserRole(membershipId: string, roleDefId: string) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) throw new Error("Membership not found");

  const canManageUsers = await hasPermission(user.id, membership.organizationId, "manage_users");
  if (!canManageUsers) {
    throw new Error("Nemáte oprávnění spravovat uživatele.");
  }

  // Find the role definition to see if it maps to a standard enum role
  const roleDef = await prisma.roleDefinition.findUnique({
    where: { id: roleDefId },
  });

  if (!roleDef) throw new Error("Role definition not found");

  // Update membership
  // We also try to update the legacy 'role' enum if the name matches, otherwise keep it as USER or something generic
  // But for now, let's just update roleDefId.
  // Actually, we should try to map it to the enum if possible for backward compatibility
  
  let legacyRole = "USER";
  if (["ADMIN", "MANAGER", "ACCOUNTANT", "WAREHOUSEMAN", "CLIENT"].includes(roleDef.name)) {
    legacyRole = roleDef.name;
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      roleDefId: roleDefId,
      // @ts-ignore - Prisma might complain if the string doesn't match the enum perfectly in types yet, but it should work if names match
      role: legacyRole, 
    },
  });

  revalidatePath("/settings/users");
}

export async function removeUserFromOrganization(membershipId: string) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
  });

  if (!membership) throw new Error("Membership not found");

  const canManageUsers = await hasPermission(user.id, membership.organizationId, "manage_users");
  if (!canManageUsers) {
    throw new Error("Nemáte oprávnění spravovat uživatele.");
  }

  await prisma.membership.delete({
    where: { id: membershipId },
  });
  revalidatePath("/settings/users");
}
