import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmailClient } from "@/components/communication/EmailClient";

export default async function CommunicationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, role: true }
  });

  if (!membership) redirect("/login");

  const canAccess = ["ADMIN", "MANAGER", "SUPERADMIN"].includes(membership.role);
  
  if (!canAccess) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Nemáte oprávnění přistupovat k této sekci.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-4rem)]">
      <h1 className="text-3xl font-bold mb-6">Komunikace</h1>
      <EmailClient />
    </div>
  );
}