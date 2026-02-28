import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLES } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const impersonatedUserId = cookieStore.get("impersonated_user_id")?.value;

  if (impersonatedUserId) {
    const user = await prisma.user.findUnique({ where: { id: impersonatedUserId } });
    if (user) return user;
  }

  // TODO: Implement real session retrieval (e.g. from cookies/JWT)
  // For now, return the first user (simulated single-user dev mode)
  // In a real app, this would decode the session token
  return await prisma.user.findFirst();
}

export async function isImpersonating() {
  return cookies().has("impersonated_user_id");
}

export async function getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId },
    include: { roleDefinition: true },
  });

  if (!membership) return [];

  if (membership.roleDefinition) {
    try {
      return JSON.parse(membership.roleDefinition.permissions);
    } catch (e) {
      console.error("Failed to parse permissions for role", membership.roleDefinition.name, e);
      return [];
    }
  }

  // Fallback to legacy role mapping
  // We need to cast membership.role (enum) to string to use as key
  const roleName = membership.role as unknown as string;
  if (roleName && DEFAULT_ROLES[roleName]) {
    return DEFAULT_ROLES[roleName];
  }

  return [];
}

export async function hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return permissions.includes(permission);
}
