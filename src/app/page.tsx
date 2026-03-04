
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { CreditCard, Activity, Users, Wallet } from "lucide-react";
import { getDashboardMetrics, getForgottenInvoices, getCashflowChartData } from "@/services/dashboard";
import { getExpiringContracts } from "@/actions/contracts";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { LimitsWidget } from "@/components/dashboard/LimitsWidget";
import { NetProfitWidget } from "@/components/dashboard/NetProfitWidget";
import { FoxTip } from "@/components/fox/FoxTip";
import { ForgottenInvoicesAlert } from "@/components/dashboard/ForgottenInvoicesAlert";
import { ExpiringContractsWidget } from "@/components/dashboard/ExpiringContractsWidget";
import { getCurrentUser, hasPermission, getCurrentMembership } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";
import { DashboardPreferencesWidget } from "@/components/dashboard/DashboardPreferencesWidget";
import { ZenModeButton } from "@/components/dashboard/ZenModeButton";
import { LazyCashflowChart } from "@/components/dashboard/LazyCharts";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const membership = await getCurrentMembership(user.id);

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
    } catch {
      // Ignore invalid stored preferences
    }
  }

  // Assume if role is not Admin/Manager, apply department filter
  const isRestricted = !!currentUser?.department && !["ADMIN", "MANAGER", "SUPERADMIN"].includes(membership.role);
  const departmentFilter: string | undefined = isRestricted ? (currentUser?.department ?? undefined) : undefined;

  // Parse date range from searchParams
  const fromStr = typeof params.from === 'string' ? params.from : undefined;
  const toStr = typeof params.to === 'string' ? params.to : undefined;
  
  let dateRange: { from: Date; to: Date } | undefined;
  
  if (fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);
      // Validate dates
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          dateRange = { from, to };
      }
  }

  // Fetch data in parallel
  const [
    metrics,
    forgottenInvoices,
    expiringContracts,
    cashflowData
  ] = await Promise.all([
    getDashboardMetrics(orgId, dateRange, departmentFilter),
    getForgottenInvoices(orgId),
    getExpiringContracts(30),
    getCashflowChartData(orgId, dateRange)
  ]);

  const widgets = [
    {
        id: "metrics",
        title: "Klíčové metriky",
        visible: true,
        size: "large" as const,
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-card border rounded-lg shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Celkové tržby</div>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.revenueChange >= 0 ? "+" : ""}{metrics.revenueChange}% oproti min. měsíci
                    </p>
                </div>
                <div className="p-4 bg-card border rounded-lg shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Počet faktur</div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{metrics.invoiceCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.invoiceCountChange >= 0 ? "+" : ""}{metrics.invoiceCountChange}% oproti min. měsíci
                    </p>
                </div>
                <div className="p-4 bg-card border rounded-lg shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Noví klienti</div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{metrics.newClientsCount}</div>
                    <p className="text-xs text-muted-foreground">
                        +{metrics.newClientsCount} tento měsíc
                    </p>
                </div>
                <div className="p-4 bg-card border rounded-lg shadow-sm">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Neuhrazeno</div>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount)}</div>
                    <p className="text-xs text-muted-foreground">
                        {metrics.overdueCount} faktur po splatnosti
                    </p>
                </div>
            </div>
        )
    },
    {
        id: "cashflow",
        title: "Cashflow",
        visible: preferences.showCashflow,
        size: "medium" as const,
        content: <LazyCashflowChart data={cashflowData} />
    },
    {
        id: "netProfit",
        title: "Čistý zisk",
        visible: preferences.showNetProfit,
        size: "small" as const,
        content: <NetProfitWidget income={metrics.incomeThisYear} expenses={metrics.expensesThisYear} />
    },
    {
        id: "limits",
        title: "Limity DPH",
        visible: preferences.showLimits,
        size: "small" as const,
        content: <LimitsWidget vatTurnover12m={metrics.vatTurnover12m} vatLimit={metrics.vatLimit} incomeThisYear={metrics.incomeThisYear} />
    },
    {
        id: "forgotten",
        title: "Zapomenuté faktury",
        visible: preferences.showForgotten,
        size: "medium" as const,
        content: <ForgottenInvoicesAlert clients={forgottenInvoices} />
    },
    {
        id: "contracts",
        title: "Kontrakty",
        visible: preferences.showContracts,
        size: "medium" as const,
        content: <ExpiringContractsWidget contracts={expiringContracts} />
    }
  ];

  return (
    <div className="container mx-auto p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Přehled</h1>
          <p className="text-muted-foreground">
            Vítejte zpět, {(user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.username) || user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ZenModeButton />
            <DateRangeFilter />
            <DashboardPreferencesWidget preferences={preferences} />
        </div>
      </div>

      {preferences.showTips && <FoxTip />}

      <WidgetGrid initialWidgets={widgets} />
    </div>
  );
}
