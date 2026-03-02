
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, CreditCard, TrendingUp, Activity, Users, Wallet, PieChart, BarChart, ShoppingCart, Clock, Camera } from "lucide-react";
import { getDashboardMetrics, getCashflowChartData, getClientShareData, getSalesHeatmapData, getForgottenInvoices } from "@/services/dashboard";
import { getExpiringContracts } from "@/actions/contracts";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
// import CashflowChart from "@/components/dashboard/CashflowChart";
// import ClientShareChart from "@/components/dashboard/ClientShareChart";
// import SalesHeatmap from "@/components/dashboard/SalesHeatmap";
import { LimitsWidget } from "@/components/dashboard/LimitsWidget";
import { NetProfitWidget } from "@/components/dashboard/NetProfitWidget";
import { FoxTip } from "@/components/fox/FoxTip";
import { ForgottenInvoicesAlert } from "@/components/dashboard/ForgottenInvoicesAlert";
import { ExpiringContractsWidget } from "@/components/dashboard/ExpiringContractsWidget";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";

import { DashboardPreferencesWidget } from "@/components/dashboard/DashboardPreferencesWidget";
import { RevenuePredictionWidget } from "@/components/dashboard/RevenuePredictionWidget";
import { BadgesWidget } from "@/components/dashboard/BadgesWidget";
import { ZenModeButton } from "@/components/dashboard/ZenModeButton";
import { LazyCashflowChart, LazyClientShareChart, LazySalesHeatmap } from "@/components/dashboard/LazyCharts";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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

  // Department Isolation
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { department: true, dashboardPreferences: true }
  });

  // Parse preferences
  let preferences = {
    showCashflow: true,
    showClientShare: true,
    showHeatmap: true,
    showLimits: true,
    showNetProfit: true,
    showTips: true,
    showForgotten: true,
    showContracts: true
  };

  if (currentUser?.dashboardPreferences) {
    try {
      const parsed = JSON.parse(currentUser.dashboardPreferences);
      preferences = { ...preferences, ...parsed };
    } catch (e) {
      console.error("Failed to parse dashboard preferences", e);
    }
  }

  // Assume if role is not Admin/Manager, apply department filter
  const isRestricted = currentUser?.department && !["ADMIN", "MANAGER", "SUPERADMIN"].includes(membership.role);
  const departmentFilter = isRestricted ? currentUser.department : undefined;

  // Parse date range from searchParams
  const fromStr = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const toStr = typeof searchParams.to === 'string' ? searchParams.to : undefined;
  
  let dateRange: { from: Date; to: Date } | undefined;
  
  if (fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);
      // Validate dates
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          dateRange = { from, to };
      }
  }

  const [
    metrics,
    cashflowData,
    clientShareData,
    heatmapData,
    forgottenInvoices,
    expiringContracts
  ] = await Promise.all([
    getDashboardMetrics(orgId, dateRange, departmentFilter || undefined),
    getCashflowChartData(orgId, dateRange),
    getClientShareData(orgId, dateRange),
    getSalesHeatmapData(orgId, dateRange),
    getForgottenInvoices(orgId),
    getExpiringContracts(30)
  ]);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Přehled</h1>
        <div className="flex gap-2 items-center">
            <ZenModeButton />
            <DashboardPreferencesWidget preferences={preferences} />
            <DateRangeFilter />
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
      {preferences.showTips && <FoxTip />}

      <BadgesWidget userId={user.id} orgId={orgId} />

      {/* Year in Review Banner */}
      {(new Date().getMonth() === 11 || new Date().getMonth() === 0) && (
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-900 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-orange-500 rounded-full text-white">
               <Activity className="h-6 w-6" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">
                 Vaše shrnutí roku {new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()} je tady!
               </h3>
               <p className="text-orange-800/80 dark:text-orange-200/80">
                 Podívejte se na své úspěchy, statistiky a kolik kávy jste vypili.
               </p>
             </div>
          </div>
          <Link href="/reports/year-in-review">
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-full shadow-lg transition-transform transform hover:scale-105">
              Zobrazit shrnutí
            </button>
          </Link>
        </div>
      )}

      {/* Forgotten Invoices Alert */}
      {preferences.showForgotten && <ForgottenInvoicesAlert clients={forgottenInvoices} />}

      {/* Expiring Contracts Widget */}
      {preferences.showContracts && <ExpiringContractsWidget contracts={expiringContracts} />}

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
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Odhad DPH k odvodu</h3>
            <PieChart className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.vatToPayQuarterly)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Za aktuální čtvrtletí (Predikce)
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
      
      {/* OSVČ Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        {preferences.showLimits && (
          <LimitsWidget 
            vatTurnover12m={metrics.vatTurnover12m} 
            vatLimit={metrics.vatLimit} 
            incomeThisYear={metrics.incomeThisYear}
          />
        )}
        {preferences.showNetProfit && (
          <NetProfitWidget 
            income={metrics.incomeThisYear} 
            expenses={metrics.expensesThisYear}
          />
        )}
        
        {/* AI Prediction Widget */}
        <RevenuePredictionWidget organizationId={orgId} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {preferences.showCashflow && (
          <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-medium">Cashflow (Posledních 6 měsíců)</h3>
            </div>
            <div className="p-6">
              <LazyCashflowChart data={cashflowData} />
            </div>
          </div>
        )}
        
        {preferences.showClientShare && (
          <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-0">
              <h3 className="text-lg font-medium">Top Klienti (Podíl na obratu)</h3>
            </div>
            <div className="p-6">
              <LazyClientShareChart data={clientShareData} />
            </div>
          </div>
        )}
      </div>

      {/* Sales Heatmap */}
      {preferences.showHeatmap && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Aktivita prodejů (Heatmapa)</h3>
            <p className="text-sm text-muted-foreground">Přehled vystavených faktur za poslední rok</p>
          </div>
          <LazySalesHeatmap data={heatmapData} />
        </div>
      )}
      
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
      <Link
        href="/ocr"
        className="fixed bottom-20 right-4 h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center md:hidden hover:bg-primary/90 transition-colors z-40"
      >
        <Camera className="h-6 w-6" />
      </Link>
    </div>
  );
}
