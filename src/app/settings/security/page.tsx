import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";
import { TwoFactorSetup } from "@/components/settings/TwoFactorSetup";
import { EmergencyAccessSettings } from "@/components/settings/EmergencyAccessSettings";
import { prisma } from "@/lib/prisma";

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) return <div>Organizace nenalezena</div>;

  // Fetch fresh user data to get 2FA status
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true },
  });

  // Fetch users for emergency contact selection (only for admins)
  const orgUsers = await prisma.membership.findMany({
    where: { organizationId: membership.organizationId },
    include: { user: true }
  });

  // Fetch current emergency contact
  const currentEmergencyAccess = await prisma.emergencyAccess.findFirst({
    where: { 
        organizationId: membership.organizationId,
        isPending: false,
        grantedAt: null,
        requestedAt: null
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Zabezpečení</h3>
        <p className="text-sm text-muted-foreground">
          Spravujte nastavení bezpečnosti vašeho účtu.
        </p>
      </div>
      <div className="grid gap-6">
        <TwoFactorSetup isEnabled={dbUser?.twoFactorEnabled || false} />
        
        {/* Only show Emergency Access settings to Admins */}
        {membership.role === "ADMIN" && (
            <EmergencyAccessSettings 
                users={orgUsers} 
                currentContactId={currentEmergencyAccess?.userId} 
            />
        )}
      </div>
    </div>
  );
}
