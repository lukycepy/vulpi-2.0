import { TemplateBuilder } from "@/components/settings/TemplateBuilder";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  
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

  const template = await prisma.invoiceTemplate.findUnique({
    where: { id: params.id }
  });

  if (!template) {
    notFound();
  }

  if (template.organizationId !== membership.organizationId) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění zobrazit tuto šablonu.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upravit šablonu</h1>
        <p className="text-muted-foreground mt-2">
          Upravte vzhled vaší šablony faktury.
        </p>
      </div>

      <TemplateBuilder initialTemplate={template} organizationId={membership.organizationId} />
    </div>
  );
}
