
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, CreditCard, TrendingUp, Activity, Users, Wallet, PieChart, BarChart, ShoppingCart, Clock } from "lucide-react";
import { getDashboardMetrics, getCashflowChartData, getClientShareData } from "@/services/dashboard";
import CashflowChart from "@/components/dashboard/CashflowChart";
import ClientShareChart from "@/components/dashboard/ClientShareChart";
import { FoxTip } from "@/components/fox/FoxTip";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace. Prosím spusťte seed script.</div>;
  }
  
  const orgId = membership.organizationId;
  const canViewDashboard = await hasPermission(user.id, orgId, "view_dashboard");

  if (!canViewDashboard) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění zobrazit přehled.
        </div>
      </div>
    );
  }

  const [
    metrics,
    cashflowData,
    clientShareData
  ] = await Promise.all([
    getDashboardMetrics(orgId),
    getCashflowChartData(orgId),
    getClientShareData(orgId)
  ]);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h1>
        <div className="flex gap-2">
            <Link 
            href="/expenses/new" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            >
            <CreditCard className="mr-2 h-4 w-4" />
            Nový výdaj
            </Link>
            <Link 
            href="/invoices/new" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
            <TrendingUp className="mr-2 h-4 w-4" />
            Nová faktura
            </Link>
        </div>
      </div>

      {/* Fox Tip Widget */}
      <FoxTip />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Příjmy (Měsíc)</h3>
            <Wallet className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            + {formatCurrency(metrics.vatCollected)} DPH
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Odhad Zisku</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.netProfit)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Po odečtení nákladů a DPH
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Predikce DPH</h3>
            <PieChart className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.vatToPay)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            K úhradě (Vybráno - Zaplaceno)
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">LTV Klienta</h3>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Průměrný celkový příjem na klienta
          </p>
        </div>
      </div>
      
      {/* VAT Limit Progress */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-row items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Limit DPH (12 měsíců)</h3>
            <span className="text-sm text-muted-foreground">{metrics.vatLimitPercentage.toFixed(1)}% z 2 mil. Kč</span>
        </div>
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
            <div 
                className={`h-full ${metrics.vatLimitPercentage > 85 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(metrics.vatLimitPercentage, 100)}%` }}
            />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
            Aktuální obrat: {formatCurrency(metrics.vatLimit)}
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-medium">Cashflow (Posledních 6 měsíců)</h3>
          </div>
          <div className="p-6">
            <CashflowChart data={cashflowData} />
          </div>
        </div>
        
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-medium">Top Klienti (Podíl na obratu)</h3>
          </div>
          <div className="p-6">
            <ClientShareChart data={clientShareData} />
          </div>
        </div>
      </div>
      
      {/* Quick Access Grid */}
      <h2 className="text-xl font-bold tracking-tight mt-8">Rychlé akce</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Link href="/projects" className="group rounded-xl border bg-card p-6 shadow-sm hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20">
                    <BarChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-medium">Projekty</h3>
                    <p className="text-sm text-muted-foreground">Správa projektů a rozpočtů</p>
                </div>
            </div>
         </Link>
         
         <Link href="/time-tracking" className="group rounded-xl border bg-card p-6 shadow-sm hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20">
                    <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-medium">Měření času</h3>
                    <p className="text-sm text-muted-foreground">Výkazy a stopky</p>
                </div>
            </div>
         </Link>
         
         <Link href="/inventory" className="group rounded-xl border bg-card p-6 shadow-sm hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-medium">Sklad</h3>
                    <p className="text-sm text-muted-foreground">Zboží a pohyby</p>
                </div>
            </div>
         </Link>

         <Link href="/approvals" className="group rounded-xl border bg-card p-6 shadow-sm hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20">
                    <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-medium">Schvalování</h3>
                    <p className="text-sm text-muted-foreground">Faktury k potvrzení</p>
                </div>
            </div>
         </Link>
      </div>
    </div>
  );
}
