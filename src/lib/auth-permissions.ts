import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLES } from "@/lib/permissions";
import { cookies } from "next/headers";
import { decryptString } from "@/lib/crypto";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get("impersonated_user_id")?.value;

  if (impersonatedUserId) {
    const user = await prisma.user.findUnique({ where: { id: impersonatedUserId } });
    if (user) return user;
  }

  const authToken = cookieStore.get("auth_token")?.value;
  if (!authToken) return null;

  try {
    const userId = decryptString(authToken);
    if (!userId) return null;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Check if user is blocked
    if (user?.isBlocked) {
        return null;
    }

    return user;
  } catch (e) {
    return null;
  }
}

export async function getCurrentMembership(userId: string) {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;

    let membership = null;

    if (activeOrgId) {
        membership = await prisma.membership.findFirst({
            where: { userId, organizationId: activeOrgId },
            include: { organization: true }
        });
    }

    if (!membership) {
        membership = await prisma.membership.findFirst({
            where: { userId },
            include: { organization: true }
        });
    }

    return membership;
}

export async function isImpersonating() {
  const cookieStore = await cookies();
  return cookieStore.has("impersonated_user_id");
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
  const roleName = membership.role;
  if (roleName && roleName in DEFAULT_ROLES) {
    return DEFAULT_ROLES[roleName as keyof typeof DEFAULT_ROLES];
  }

  return [];
}

export async function hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  return permissions.includes(permission);
}
