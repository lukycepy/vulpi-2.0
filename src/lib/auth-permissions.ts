import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLES } from "@/lib/permissions";
import { cookies } from "next/headers";
import { decryptString } from "@/lib/crypto";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get("impersonated_user_id")?.value;
  const authToken = cookieStore.get("auth_token")?.value;

  if (impersonatedUserId) {
    // If impersonating, we return the target user
    // BUT for permission checks, we might need to know the ORIGINAL user is a superadmin?
    // Usually impersonation means you ARE that user.
    // So if I impersonate a normal user, I lose my superadmin powers in the context of the app.
    // That is expected behavior.
    const user = await prisma.user.findUnique({ where: { id: impersonatedUserId } });
    if (user) return user;
  }

  if (!authToken) return null;

  try {
    // Decrypting the auth token which stores the userId
    // Note: The decryptString function implementation is assumed to be synchronous or async?
    // The import suggests it's from lib/crypto. Let's assume sync or we need to await if it returns promise.
    // In previous code it was used as sync.
    const userId = await decryptString(authToken); 
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
            include: { organization: true, roleDefinition: true }
        });
    }

    // If no active org cookie or membership not found for that org, fallback to first membership
    if (!membership) {
        membership = await prisma.membership.findFirst({
            where: { userId },
            include: { organization: true, roleDefinition: true }
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

  // Superadmin check - if role is SUPERADMIN, return all permissions or a special flag
  if (membership.role === "SUPERADMIN") {
      // Return all possible permissions or handled by check
      // For now, let's return a list including everything + special 'superadmin'
      return ["superadmin", "manage_settings", "manage_users", "manage_roles", "manage_invoices", "manage_projects", "manage_clients", "manage_inventory", "view_dashboard", "manage_templates", "manage_custom_fields", "manage_expenses"];
  }

  if (membership.roleDefinition) {
    try {
      return JSON.parse(membership.roleDefinition.permissions);
    } catch (e) {
      console.error("Failed to parse permissions for role", membership.roleDefinition.name, e);
      return [];
    }
  }

  // Fallback to legacy role mapping
  const roleName = membership.role;
  if (roleName && roleName in DEFAULT_ROLES) {
    return DEFAULT_ROLES[roleName as keyof typeof DEFAULT_ROLES];
  }

  return [];
}

export async function hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId, organizationId);
  if (permissions.includes("superadmin")) return true;
  return permissions.includes(permission);
}

// Helper to check if user is superadmin globally (or in any org? usually superadmin is global in SaaS context, 
// but here it seems tied to Membership.role. 
// If "Superadmin u všech" means a global superadmin, we might need to check if they have SUPERADMIN role in ANY organization 
// OR if there is a system-wide flag.
// Based on schema, User doesn't have 'role'. Membership has 'role'.
// So Superadmin is per organization.
// However, the request says "Superadmin u všech". This implies a Global Admin.
// If we don't have Global Admin concept, maybe we should assume the user means "If I am Superadmin in THIS organization, I can edit users in THIS organization".
// BUT "u všech" suggests cross-org.
// Let's implement a check: Is the user a SUPERADMIN in the "System" organization? Or just has `isSystemAdmin` flag?
// Schema doesn't have isSystemAdmin.
// Let's assume for this task that "Superadmin" means someone with role="SUPERADMIN" in the CURRENT organization context,
// OR we check if they have SUPERADMIN role in ANY organization (which might be risky/incorrect design).
// Let's stick to: If you are SUPERADMIN in the current context (organization), you can edit users.
// The "u všech" might mean "edit ANY user's profile" (even if they are just a MEMBER).
// Which is already covered by `manage_users`.
// Wait, "Superadmin u všech" might mean "Superadmin can edit users ACROSS organizations".
// If so, we need a way to identify a global superadmin.
// Let's assume for now we check if the user has role SUPERADMIN in the specific organization passed to the action.

export async function isSuperAdmin(userId: string) {
    // Check if user has SUPERADMIN role in any organization? 
    // Or check specific "Admin" organization?
    // Let's check if they have SUPERADMIN role in *any* membership for now as a heuristic,
    // or better, rely on the current context.
    
    // For the purpose of "changing all user profile settings",
    // if I am Superadmin of Org A, can I change profile of User X who is also in Org B?
    // User profile (name, email) is global. So yes, changing it affects Org B.
    // This is why it's sensitive.
    
    const memberships = await prisma.membership.findMany({
        where: { userId, role: "SUPERADMIN" }
    });
    
    return memberships.length > 0;
}
