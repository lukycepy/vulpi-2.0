import { prisma } from "@/lib/prisma";
import { getOrganizationUsers } from "@/actions/users";
import { getRoles } from "@/actions/roles";
import { UserManager } from "@/components/settings/UserManager";
import { getCurrentUser, getUserPermissions } from "@/lib/auth-permissions";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div>Uživatel nenalezen.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: currentUser.id }
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }

  const orgId = membership.organizationId;
  const permissions = await getUserPermissions(currentUser.id, orgId);
  const canImpersonate = permissions.includes("impersonate_users");
  const canManageUsers = permissions.includes("manage_users");

  if (!canManageUsers) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu uživatelů.
        </div>
      </div>
    );
  }

  const memberships = await getOrganizationUsers(orgId);
  const roles = await getRoles(orgId);

  return (
    <div className="container mx-auto py-10">
      <UserManager 
        memberships={memberships as any} 
        roles={roles} 
        currentUserId={currentUser.id} 
        canImpersonate={canImpersonate}
      />
    </div>
  );
}
