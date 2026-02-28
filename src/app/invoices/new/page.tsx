import { prisma } from "@/lib/prisma";
import InvoiceEditor from "@/components/invoices/InvoiceEditor";
import { fetchCNBRates } from "@/services/cnb";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

import { getCustomFieldDefinitions } from "@/actions/custom-fields";

interface PageProps {
  searchParams: Promise<{ from?: string; mode?: string }>;
}

export default async function NewInvoicePage(props: PageProps) {
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
          Nemáte oprávnění vytvářet faktury.
        </div>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const { from, mode } = searchParams;

  const [clients, bankDetails, cnbRates, customFields] = await Promise.all([
    prisma.client.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
    prisma.bankDetail.findMany({ where: { organizationId: orgId }, select: { id: true, bankName: true, accountNumber: true } }),
    fetchCNBRates(),
    getCustomFieldDefinitions(orgId),
  ]);

  let initialData = null;

  if (from) {
    const sourceInvoice = await prisma.invoice.findUnique({
      where: { id: from },
      include: { items: true }
    });

    if (sourceInvoice) {
      initialData = {
        clientId: sourceInvoice.clientId,
        bankDetailId: sourceInvoice.bankDetailId || "",
        notes: sourceInvoice.notes || "",
        vatMode: sourceInvoice.vatMode,
        exchangeRate: sourceInvoice.exchangeRate,
        discount: sourceInvoice.discount,
        items: sourceInvoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            totalAmount: item.totalAmount
        }))
      };

      // Mode specific adjustments
      const today = new Date();
      const due = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split('T')[0];
      const dueStr = due.toISOString().split('T')[0];

      if (mode === 'convert') {
         initialData.type = 'FAKTURA';
         initialData.number = new Date().getFullYear() + "001"; 
         initialData.issuedAt = todayStr;
         initialData.dueAt = dueStr;
      } else if (mode === 'duplicate') {
         initialData.type = sourceInvoice.type; // Keep original type
         initialData.number = new Date().getFullYear() + "001";
         initialData.issuedAt = todayStr;
         initialData.dueAt = dueStr;
      } else if (mode === 'credit_note') {
         initialData.type = 'DOBROPIS';
         initialData.relatedId = sourceInvoice.id; // Pass relatedId
         initialData.number = "D" + new Date().getFullYear() + "001";
         initialData.issuedAt = todayStr;
         initialData.dueAt = dueStr;
      } else {
         // Fallback if just 'from' is present without specific mode (e.g. simple copy)
         initialData.type = sourceInvoice.type;
         initialData.number = new Date().getFullYear() + "001";
      }
    }
  }

  return (
    <div>
      <InvoiceEditor 
        clients={clients} 
        bankDetails={bankDetails} 
        cnbRates={cnbRates}
        customFields={customFields}
        initialData={initialData}
      />
    </div>
  );
}
