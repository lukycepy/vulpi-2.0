
import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./ProfileForm";
import { DangerZone } from "@/components/settings/DangerZone";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Ensure user data is fresh
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) redirect("/login");

  return (
    <div className="container mx-auto py-10 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Můj profil</h1>
        <p className="text-muted-foreground">Spravujte své osobní údaje a nastavení účtu.</p>
      </div>
      
      <ProfileForm user={dbUser} />
      
      <div className="pt-8 border-t">
        <h2 className="text-xl font-semibold text-destructive mb-4">Nebezpečná zóna</h2>
        <DangerZone />
      </div>
    </div>
  );
}
