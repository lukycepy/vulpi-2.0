import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "@/services/dashboard";
import { InsuranceCalculator } from "@/components/reports/InsuranceCalculator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InsurancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  
  const orgId = membership.organizationId;
  const metrics = await getDashboardMetrics(orgId);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Přehled pojištění (OSVČ)</h1>
        <p className="text-muted-foreground mt-2">
          Kalkulačka a odhad záloh na sociální a zdravotní pojištění.
        </p>
      </div>
      
      <InsuranceCalculator 
        initialIncome={metrics.incomeThisYear} 
        initialExpenses={metrics.expensesThisYear} 
      />
    </div>
  );
}
