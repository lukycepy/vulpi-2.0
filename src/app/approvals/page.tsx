import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getPendingApprovals } from "@/actions/approvals";
import { Check, X, FileText, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-permissions";
import { ApproveButton } from "@/components/approvals/ApproveButton";
import { RejectDialog } from "@/components/approvals/RejectDialog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Schvalování | Vulpi",
  description: "Schvalovací procesy pro faktury",
};

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Uživatel nenalezen.
        </div>
      </div>
    );
  }

  const pendingRequests = await getPendingApprovals(user.id);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schvalování</h1>
          <p className="text-muted-foreground mt-2">
            Inbox dokumentů čekajících na vaše schválení.
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
            <div key={request.id} className="bg-card border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Ke schválení
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Žádost z {formatDate(request.createdAt)}
                  </span>
                  <span className="text-sm text-muted-foreground px-2 border-l">
                    {request.invoice.organization.name}
                  </span>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Faktura {request.invoice.number}
                      <Link href={`/invoices/${request.invoice.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </h3>
                    <p className="text-muted-foreground">
                      Klient: <span className="font-medium text-foreground">{request.invoice.client.name}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded w-fit">
                      <User className="h-3 w-3" />
                      Žadatel: {request.requester.firstName} {request.requester.lastName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Částka</p>
                    <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(request.invoice.totalAmount, request.invoice.currency)}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <RejectDialog approvalId={request.id} />
                    <ApproveButton approvalId={request.id} approverId={user.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
