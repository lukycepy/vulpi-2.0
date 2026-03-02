import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DisputeActions } from "@/components/portal/DisputeActions";
import { SentimentAnalyzer } from "@/components/disputes/SentimentAnalyzer";
import Link from "next/link";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default async function DisputesPage() {
  const disputes = await prisma.dispute.findMany({
    include: {
      invoice: true,
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reklamace</h1>
          <p className="text-muted-foreground mt-2">
            Správa a řešení reklamací faktur od klientů.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Zatím neevidujete žádné reklamace.
            </CardContent>
          </Card>
        ) : (
          disputes.map((dispute) => (
            <Card key={dispute.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link href={`/invoices/${dispute.invoiceId}`} className="hover:underline">
                        {dispute.invoice.number}
                      </Link>
                      <span className="text-muted-foreground font-normal text-sm">
                        • {dispute.client.name}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Vytvořeno: {dispute.createdAt.toLocaleDateString("cs-CZ")}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      dispute.status === "OPEN"
                        ? "destructive"
                        : dispute.status === "RESOLVED"
                        ? "default" // "success" if available, or default (usually black/primary)
                        : "secondary"
                    }
                    className={
                        dispute.status === "RESOLVED" ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    {dispute.status === "OPEN" && "K řešení"}
                    {dispute.status === "RESOLVED" && "Vyřešeno"}
                    {dispute.status === "REJECTED" && "Zamítnuto"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Zpráva od klienta
                      </h4>
                      <div className="bg-red-50 text-red-900 p-3 rounded-md text-sm border border-red-100 flex gap-2 items-start">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{dispute.message}</p>
                      </div>
                      <div className="mt-2">
                        <SentimentAnalyzer text={dispute.message} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground block">Částka faktury</span>
                            <span className="font-medium">{formatCurrency(dispute.invoice.totalAmount)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block">Splatnost</span>
                            <span>{dispute.invoice.dueAt.toLocaleDateString("cs-CZ")}</span>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {dispute.status === "OPEN" ? (
                      <div className="h-full flex flex-col justify-end">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Akce
                        </h4>
                        <DisputeActions disputeId={dispute.id} />
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Vaše odpověď
                        </h4>
                        <div className={`p-3 rounded-md text-sm border flex gap-2 items-start ${
                            dispute.status === "RESOLVED" 
                                ? "bg-green-50 text-green-900 border-green-100" 
                                : "bg-gray-50 text-gray-900 border-gray-100"
                        }`}>
                          {dispute.status === "RESOLVED" ? (
                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          )}
                          <p>{dispute.adminResponse || "Bez odpovědi"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
