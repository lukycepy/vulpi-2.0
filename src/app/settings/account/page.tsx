import { DangerZone } from "@/components/settings/DangerZone";
import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Nastavení účtu</h3>
        <p className="text-sm text-muted-foreground">
          Spravujte své osobní údaje a preference.
        </p>
      </div>
      
      {/* Placeholder for profile form */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">Zde bude formulář pro úpravu jména, emailu a avatara (Phase 2).</p>
      </div>

      <DangerZone />
    </div>
  );
}
