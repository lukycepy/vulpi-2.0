
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { DangerZoneClient } from "@/components/settings/DangerZoneClient";

export default async function DangerZonePage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) return <div>Organization not found.</div>;

  return <DangerZoneClient organizationId={membership.organizationId} />;
}
