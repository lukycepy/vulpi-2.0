import { TemplateBuilder } from "@/components/settings/TemplateBuilder";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function NewTemplatePage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) {
    return <div>Nemáte přístup k žádné organizaci.</div>;
  }

  const canManage = await hasPermission(user.id, membership.organizationId, "manage_templates");

  if (!canManage) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění spravovat šablony faktur.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nová šablona faktury</h1>
        <p className="text-muted-foreground mt-2">
          Vytvořte si nový vzhled faktury pomocí vizuálního editoru.
        </p>
      </div>

      <TemplateBuilder organizationId={membership.organizationId} />
    </div>
  );
}
