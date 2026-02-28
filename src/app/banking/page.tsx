import { getBankMovements, runBankMatching } from "@/actions/banking";
import { BankMovementList } from "@/components/banking/BankMovementList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export const dynamic = "force-dynamic";

export default async function BankingPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  
  const orgId = membership.organizationId;
  const canManageBank = await hasPermission(user.id, orgId, "manage_bank");

  if (!canManageBank) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu banky.
        </div>
      </div>
    );
  }

  // Fetch movements
  const movements = await getBankMovements(orgId);
  
  // Fetch summary stats
  const unmatchedCount = await prisma.bankMovement.count({
    where: { 
      bankIntegration: { organizationId: orgId },
      status: "UNMATCHED" 
    },
  });
  
  const proposedCount = await prisma.bankMovement.count({
    where: { 
      bankIntegration: { organizationId: orgId },
      status: { in: ["PROPOSED", "PROPOSED_MULTI"] } 
    },
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Zpět na přehled
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bankovnictví</h1>
          <p className="text-muted-foreground">
            Párování plateb a přehled bankovních pohybů
          </p>
        </div>
        <div className="flex gap-2">
            <form action={runBankMatching}>
                <Button type="submit">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Spustit párování
                </Button>
            </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nespárované</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unmatchedCount}</div>
            <p className="text-xs text-muted-foreground">
              Pohyby vyžadující pozornost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">K potvrzení</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{proposedCount}</div>
            <p className="text-xs text-muted-foreground">
              Navržená spárování
            </p>
          </CardContent>
        </Card>
        <Card>
            {/* Future: Bank Balance */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poslední synchronizace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dnes</div>
            <p className="text-xs text-muted-foreground">
              12:00
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bankovní pohyby</CardTitle>
        </CardHeader>
        <CardContent>
          <BankMovementList initialMovements={movements} />
        </CardContent>
      </Card>
    </div>
  );
}
