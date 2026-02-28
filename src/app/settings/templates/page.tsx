import { getInvoiceTemplates } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

export default async function TemplatesPage() {
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
  
  const templates = await getInvoiceTemplates(membership.organizationId);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Šablony faktur</h1>
        <Link href="/settings/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nová šablona
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              {/* <CardDescription>{template.description || "Bez popisu"}</CardDescription> */}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div 
                  className="w-6 h-6 rounded-full border" 
                  style={{ backgroundColor: template.primaryColor || '#000' }} 
                  title="Primární barva"
                />
                <div 
                  className="w-6 h-6 rounded-full border" 
                  style={{ backgroundColor: template.secondaryColor || '#fff' }} 
                  title="Sekundární barva"
                />
              </div>
              <div className="text-sm text-gray-500 mb-4">
                Font: {template.fontFamily}
              </div>
              <Link href={`/settings/templates/${template.id}`}>
                <Button variant="outline" className="w-full">
                  Upravit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Zatím nemáte žádné šablony. Vytvořte si první!
          </div>
        )}
      </div>
    </div>
  );
}
