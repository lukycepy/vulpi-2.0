import { prisma } from "@/lib/prisma";
import InvoiceEditor from "@/components/invoices/InvoiceEditor";
import { fetchCNBRates } from "@/services/cnb";
import { notFound } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { getCustomFieldDefinitions } from "@/actions/custom-fields";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage(props: PageProps) {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  
  const orgId = membership.organizationId;
  const canManageInvoices = await hasPermission(user.id, orgId, "manage_invoices");

  if (!canManageInvoices) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění upravovat faktury.
        </div>
      </div>
    );
  }

  const params = await props.params;
  const { id } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, customFields: true } // Changed from customFieldValues to customFields
  });

  if (!invoice) {
    notFound();
  }

  if (invoice.organizationId !== orgId) {
    return <div>Access denied.</div>;
  }

  if (invoice.isLocked) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Faktura je uzamčena</h1>
        <p className="text-muted-foreground">Tuto fakturu nelze upravovat, protože je uzamčena.</p>
        <a href={`/invoices/${id}`} className="mt-4 inline-block text-primary hover:underline">
          Zpět na detail faktury
        </a>
      </div>
    );
  }

  const [clients, bankDetails, cnbRates, customFields, organization] = await Promise.all([
    prisma.client.findMany({ 
      where: { organizationId: orgId },
      select: { id: true, name: true, language: true },
      orderBy: { name: 'asc' }
    }),
    prisma.bankDetail.findMany({ 
      where: { organizationId: orgId },
      select: { id: true, bankName: true, accountNumber: true } 
    }),
    fetchCNBRates(),
    getCustomFieldDefinitions(orgId),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { defaultGdprClause: true, defaultSlaText: true }
    })
  ]);

  const cnbRatesByCode: Record<string, number> = Object.fromEntries(
    cnbRates.map((r) => [r.code, r.rate / r.amount])
  );
  cnbRatesByCode.CZK = 1;

  // Format dates for the form (YYYY-MM-DD)
  const initialData = {
    ...invoice,
    issuedAt: invoice.issuedAt.toISOString().split('T')[0],
    dueAt: invoice.dueAt.toISOString().split('T')[0],
    items: invoice.items.map(item => ({
      ...item,
      // Ensure numeric values are numbers
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      discount: Number(item.discount),
      totalAmount: Number(item.totalAmount)
    })),
    customFields: invoice.customFields // Changed from customFieldValues to customFields
  };

  return (
    <div>
      <InvoiceEditor 
        clients={clients} 
        bankDetails={bankDetails} 
        cnbRates={cnbRatesByCode}
        customFields={customFields}
        initialData={initialData}
        organization={organization || undefined}
      />
    </div>
  );
}
