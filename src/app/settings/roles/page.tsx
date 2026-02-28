import { prisma } from "@/lib/prisma";
import { RoleManager } from "@/components/settings/RoleManager";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Uživatel nenalezen.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  const orgId = membership.organizationId;

  const canManageRoles = await hasPermission(user.id, orgId, "manage_roles");

  if (!canManageRoles) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu rolí.
        </div>
      </div>
    );
  }

  const roles = await prisma.roleDefinition.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto py-10">
      <RoleManager initialRoles={roles} organizationId={orgId} />
    </div>
  );
}
