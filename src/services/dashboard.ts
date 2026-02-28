
import { prisma } from "@/lib/prisma";

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  vatCollected: number;
  vatPaid: number;
  vatToPay: number;
  ltv: number;
  vatLimit: number;
  vatLimitPercentage: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  expenses: number;
}

export async function getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // 1. Revenue (This Month)
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: "PAID",
      paidAmount: { gt: 0 },
      issuedAt: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { totalAmount: true, totalVat: true }
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const vatCollected = paidInvoices.reduce((sum, inv) => sum + inv.totalVat, 0);

  // 2. Expenses (This Month)
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { amount: true }
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Estimate VAT on expenses (assuming standard 21% for simplicity if not tracked perfectly, 
  // but better to track if we had VAT on expenses. For now, let's assume expenses are gross and VAT is ~17.35% of gross if VAT payer)
  // Or better, let's just use 0 for now if we don't have explicit VAT on expenses model yet.
  // Actually, Expense model doesn't have vatAmount, so we'll approximate or leave as 0.
  // Let's assume 21% is included in the amount for estimation.
  const vatPaid = totalExpenses * 0.21 / 1.21; 

  // 3. Net Profit
  const netProfit = (totalRevenue - vatCollected) - (totalExpenses - vatPaid);

  // 4. LTV (Lifetime Value)
  const allPaidInvoices = await prisma.invoice.findMany({
    where: { organizationId, status: "PAID" },
    select: { totalAmount: true, clientId: true }
  });
  
  const totalLifetimeRevenue = allPaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const uniqueClients = new Set(allPaidInvoices.map(inv => inv.clientId)).size;
  const ltv = uniqueClients > 0 ? totalLifetimeRevenue / uniqueClients : 0;

  // 5. VAT Limit (Last 12 Months)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  
  const last12MonthsInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: "PAID", // Or ISSUED depending on method, usually actual income
      issuedAt: { gte: oneYearAgo }
    },
    select: { totalAmount: true }
  });
  
  const vatLimit = last12MonthsInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const vatLimitPercentage = (vatLimit / 2000000) * 100;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    vatCollected,
    vatPaid,
    vatToPay: vatCollected - vatPaid,
    ltv,
    vatLimit,
    vatLimitPercentage
  };
}

export async function getCashflowChartData(organizationId: string): Promise<ChartData[]> {
  const now = new Date();
  const data: ChartData[] = [];
  
  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const revenue = await prisma.invoice.aggregate({
      where: {
        organizationId,
        status: "PAID",
        issuedAt: { gte: start, lte: end }
      },
      _sum: { totalAmount: true }
    });
    
    const expenses = await prisma.expense.aggregate({
      where: {
        organizationId,
        date: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });
    
    data.push({
      date: start.toLocaleString('cs-CZ', { month: 'short' }),
      revenue: revenue._sum.totalAmount || 0,
      expenses: expenses._sum.amount || 0
    });
  }
  
  return data;
}

export async function getClientShareData(organizationId: string) {
  const result = await prisma.invoice.groupBy({
    by: ['clientId'],
    where: {
      organizationId,
      status: "PAID"
    },
    _sum: { totalAmount: true },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 5
  });

  const clients = await prisma.client.findMany({
    where: {
      id: { in: result.map(r => r.clientId) }
    },
    select: { id: true, name: true }
  });

  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return result.map((r, index) => ({
    name: clientMap.get(r.clientId) || "Neznámý",
    value: r._sum.totalAmount || 0,
    color: COLORS[index % COLORS.length]
  }));
}
