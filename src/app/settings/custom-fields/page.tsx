import { getCustomFieldDefinitions } from "@/actions/custom-fields";
import { CustomFieldManager } from "@/components/settings/CustomFieldManager";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomFieldsPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) {
    return <div>Nemáte přístup k žádné organizaci.</div>;
  }

  const canManage = await hasPermission(user.id, membership.organizationId, "manage_custom_fields");

  if (!canManage) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění spravovat vlastní pole.
        </div>
      </div>
    );
  }
  
  const customFields = await getCustomFieldDefinitions(membership.organizationId);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Vlastní pole</h1>
        <p className="text-muted-foreground mt-2">
          Definujte si vlastní datová pole, která chcete evidovat u faktur (např. číslo projektu, SPZ vozidla).
        </p>
      </div>

      <CustomFieldManager initialFields={customFields} organizationId={membership.organizationId} />
    </div>
  );
}
