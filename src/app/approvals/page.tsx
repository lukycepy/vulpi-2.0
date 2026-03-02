import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { approveInvoice, rejectInvoice } from "@/actions/approvals";
import { Check, X, FileText, User } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Schvalování | Vulpi",
  description: "Schvalovací procesy pro faktury",
};

export default async function ApprovalsPage() {
  const user = await prisma.user.findFirst();
  
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Uživatel nenalezen.
        </div>
      </div>
    );
  }

  const rawRequests = await prisma.approvalRequest.findMany({
    where: { 
      status: "PENDING",
      entityType: "INVOICE"
    },
    include: {
      requester: true
    },
    orderBy: { createdAt: "desc" }
  });

  const invoiceIds = rawRequests.map(r => r.entityId);
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds } },
    include: { client: true }
  });

  const pendingRequests = rawRequests
    .map(request => {
      const invoice = invoices.find(i => i.id === request.entityId);
      return { ...request, invoice };
    })
    .filter((req): req is (typeof rawRequests[0] & { invoice: NonNullable<typeof invoices[0]> }) => !!req.invoice);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schvalování</h1>
          <p className="text-muted-foreground mt-2">
            Přehled faktur čekajících na schválení.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Check className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Vše schváleno</h3>
            <p className="text-muted-foreground mt-1">
              Momentálně nejsou žádné žádosti ke schválení.
            </p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="bg-card border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    Ke schválení
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Žádost z {formatDate(request.invoice.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Faktura {request.invoice.number}
                    </h3>
                    <p className="text-muted-foreground">
                      Klient: {request.invoice.client.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      Žadatel: {request.requester.firstName} {request.requester.lastName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Částka</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(request.invoice.totalAmount, request.invoice.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    + DPH: {formatCurrency(request.invoice.totalVat, request.invoice.currency)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    href={`/invoices/${request.invoice.id}`}
                    className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
                  >
                    Detail
                  </Link>
                  
                  <form action={rejectInvoice.bind(null, request.id, "Zamítnuto")}>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-destructive/20 text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Zamítnout
                    </button>
                  </form>

                  <form action={approveInvoice.bind(null, request.id, "Schváleno")}>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Schválit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
