import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";
import { TwoFactorSetup } from "@/components/settings/TwoFactorSetup";
import { EmergencyAccessSettings } from "@/components/settings/EmergencyAccessSettings";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Globe } from "lucide-react";

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

  // Fetch login history
  const loginHistory = await prisma.auditLog.findMany({
    where: {
        userId: user.id,
        action: "USER_LOGIN"
    },
    orderBy: { createdAt: "desc" },
    take: 5
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
                organizationId={membership.organizationId}
            />
        )}

        <Card>
            <CardHeader>
                <CardTitle className="text-base">Historie přihlášení</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loginHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Žádná historie přihlášení.</p>
                    ) : (
                        loginHistory.map((log) => {
                            let location = "Neznámá lokace";
                            try {
                                if (log.newData) {
                                    const data = JSON.parse(log.newData);
                                    if (data.city && data.country) {
                                        location = `${data.city}, ${data.country}`;
                                    }
                                }
                            } catch (e) {}

                            return (
                                <div key={log.id} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            {location}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                            <Globe className="h-3 w-3" />
                                            IP: {log.ipAddress || "N/A"}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {log.createdAt.toLocaleString("cs-CZ")}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
