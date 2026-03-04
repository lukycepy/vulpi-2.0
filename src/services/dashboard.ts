"use server";

import { prisma } from "@/lib/prisma";


export interface ForgottenClient {
  id: string;
  name: string;
  lastInvoiceDate: Date;
  frequency: string; 
}

export interface DashboardMetrics {
  totalRevenue: number;
  vatCollected: number;
  netProfit: number;
  totalExpenses: number;
  vatToPayQuarterly: number;
  ltv: number;
  vatLimitPercentage: number;
  vatTurnover12m: number;
  vatLimit: number;
  incomeThisYear: number;
  expensesThisYear: number;
  // UI extras
  revenueChange: number;
  invoiceCount: number;
  invoiceCountChange: number;
  newClientsCount: number;
  overdueAmount: number;
  overdueCount: number;
  last12MonthsTurnover: number;
}

export interface CashflowDataPoint {
  date: string; // "YYYY-MM"
  revenue: number;
  expenses: number;
}

export interface ClientShareDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface HeatmapDataPoint {
  date: string;
  value: number;
}

export async function getDashboardMetrics(
  organizationId: string, 
  dateRange?: { from: Date; to: Date },
  department?: string
): Promise<DashboardMetrics> {
  const whereDate = dateRange ? {
    issuedAt: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  } : {};

  const departmentFilter = department ? { department } : {};

  // 1. Revenue & VAT
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: 'PAID',
      ...whereDate,
      ...departmentFilter
    },
    select: {
      totalAmount: true,
      totalVat: true,
      items: {
        select: {
          totalAmount: true
        }
      }
    }
  });

  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);
  const vatCollected = paidInvoices.reduce((sum, inv) => sum + inv.totalVat, 0);

  // 2. Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      ...(dateRange ? {
        date: {
          gte: dateRange.from,
          lte: dateRange.to
        }
      } : {})
    },
    select: {
      amount: true
    }
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const vatPaid = 0; // Expenses don't have VAT info in current schema

  // 3. VAT Turnover (Last 12 months for registration limit)
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  
  const turnoverInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: 'DRAFT' }, // Issued invoices count towards turnover
      issuedAt: {
        gte: oneYearAgo
      }
    },
    select: {
      totalAmount: true,
      totalVat: true
    }
  });
  
  const vatTurnover12m = turnoverInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);
  const vatLimit = 2_000_000; // CZK limit
  const vatLimitPercentage = (vatTurnover12m / vatLimit) * 100;

  // 4. Current Year Income & Expenses (Calendar Year)
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
  
  // Note: paidAt might not exist in Prisma schema if we only have status.
  // Usually Invoice has `paidAt` or we check `status: PAID` and use `updatedAt` as proxy if `paidAt` is missing.
  // Checking schema... user log says `Unknown argument paidAt`.
  // So `paidAt` is missing. We should use `updatedAt` or just `issuedAt` for simplicity if paidAt is missing,
  // or add paidAt to schema.
  // For now, let's use `updatedAt` for PAID invoices as a proxy for payment date.
  
  const yearInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: 'PAID',
      updatedAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    },
    select: {
      totalAmount: true,
      totalVat: true
    }
  });
  
  const incomeThisYear = yearInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);

  const yearExpenses = await prisma.expense.findMany({
    where: {
      organizationId,
      date: {
        gte: startOfYear,
        lte: endOfYear
      }
    },
    select: {
      amount: true
    }
  });
  
  const expensesThisYear = yearExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // 5. LTV
  const clientsCount = await prisma.client.count({
    where: { organizationId }
  });
  
  const allTimeInvoices = await prisma.invoice.aggregate({
    where: { organizationId, status: 'PAID' },
    _sum: { totalAmount: true, totalVat: true }
  });
  
  const allTimeRevenue = (allTimeInvoices._sum.totalAmount || 0) - (allTimeInvoices._sum.totalVat || 0);
  const ltv = clientsCount > 0 ? allTimeRevenue / clientsCount : 0;

  // Extras for UI widgets
  // Determine current period
  const now = new Date();
  const currentFrom = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const currentTo = dateRange?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const periodMs = currentTo.getTime() - currentFrom.getTime();
  const prevFrom = new Date(currentFrom.getTime() - periodMs);
  const prevTo = new Date(currentTo.getTime() - periodMs);

  // Current period revenue and invoice count
  const [currentInvoices, previousInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: { not: 'DRAFT' },
        issuedAt: { gte: currentFrom, lte: currentTo },
        ...departmentFilter
      },
      select: { totalAmount: true, totalVat: true, id: true }
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: { not: 'DRAFT' },
        issuedAt: { gte: prevFrom, lte: prevTo },
        ...departmentFilter
      },
      select: { totalAmount: true, totalVat: true, id: true }
    })
  ]);

  const currentRevenue = currentInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);
  const previousRevenue = previousInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);
  const invoiceCount = currentInvoices.length;
  const previousCount = previousInvoices.length;

  const revenueChange = previousRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  const invoiceCountChange = previousCount === 0 ? (invoiceCount > 0 ? 100 : 0) : ((invoiceCount - previousCount) / previousCount) * 100;

  // New clients in current period
  const newClientsCount = await prisma.client.count({
    where: {
      organizationId,
      createdAt: { gte: currentFrom, lte: currentTo }
    }
  });

  // Overdue invoices
  const overdue = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: 'PAID' },
      dueAt: { lt: new Date() },
      ...departmentFilter
    },
    select: { totalAmount: true, totalVat: true, id: true }
  });
  const overdueAmount = overdue.reduce((sum, inv) => sum + (inv.totalAmount - inv.totalVat), 0);
  const overdueCount = overdue.length;

  return {
    totalRevenue,
    vatCollected,
    netProfit: totalRevenue - totalExpenses,
    totalExpenses,
    vatToPayQuarterly: vatCollected - vatPaid, // Simplified approximation
    ltv,
    vatLimitPercentage,
    vatTurnover12m,
    vatLimit,
    incomeThisYear,
    expensesThisYear,
    revenueChange,
    invoiceCount,
    invoiceCountChange,
    newClientsCount,
    overdueAmount,
    overdueCount,
    last12MonthsTurnover: vatTurnover12m
  };
}

export async function getCashflowChartData(
  organizationId: string, 
  dateRange?: { from: Date; to: Date }
): Promise<CashflowDataPoint[]> {
  // Default to last 6 months if no range
  let startDate = dateRange?.from;
  let endDate = dateRange?.to || new Date();

  if (!startDate) {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);
  }

  // Get data grouped by month
  // Since Prisma groupBy doesn't support date truncation easily across DBs without raw query,
  // we'll fetch and aggregate in JS for simplicity (assuming not huge data volume yet)
  
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: 'PAID',
      updatedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      updatedAt: true,
      totalAmount: true,
      totalVat: true
    }
  });

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      date: true,
      amount: true
    }
  });

  const map = new Map<string, CashflowDataPoint>();

  // Init map with all months
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, {
      date: key,
      revenue: 0,
      expenses: 0,
      profit: 0
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Aggregate Revenue
  for (const invoice of invoices) {
    const date = new Date(invoice.updatedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const point = map.get(key);
    if (point) {
      point.revenue += (invoice.totalAmount - invoice.totalVat);
    }
  }

  // Aggregate Expenses
  for (const expense of expenses) {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const point = map.get(key);
    if (point) {
      point.expenses += expense.amount;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getClientShareData(
  organizationId: string, 
  dateRange?: { from: Date; to: Date }
): Promise<ClientShareDataPoint[]> {
  const whereDate = dateRange ? {
    issuedAt: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  } : {};

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: 'DRAFT' },
      ...whereDate
    },
    include: {
      client: {
        select: { name: true }
      }
    }
  });

  const clientMap = new Map<string, number>();

  for (const inv of invoices) {
    const name = inv.client.name;
    const amount = inv.totalAmount - inv.totalVat;
    clientMap.set(name, (clientMap.get(name) || 0) + amount);
  }

  const sorted = Array.from(clientMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const colors = ["#2563eb", "#db2777", "#ea580c", "#16a34a", "#9333ea", "#4b5563"];

  // Top 5 + Others
  if (sorted.length > 5) {
    const top5 = sorted.slice(0, 5).map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));
    const othersValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    return [...top5, { name: "Ostatní", value: othersValue, color: "#9ca3af" }];
  }

  return sorted.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));
}

export async function getSalesHeatmapData(
  organizationId: string, 
  dateRange?: { from: Date; to: Date }
): Promise<HeatmapDataPoint[]> {
  // Last 12 months for heatmap usually
  const startDate = dateRange?.from || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const endDate = dateRange?.to || new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: 'DRAFT' },
      issuedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      issuedAt: true,
      totalAmount: true,
      totalVat: true
    }
  });

  const heatmapMap = new Map<string, number>();

  for (const inv of invoices) {
    const date = new Date(inv.issuedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
  }

  return Array.from(heatmapMap.entries()).map(([date, value]) => ({ date, value }));
}

export async function getForgottenInvoices(organizationId: string): Promise<ForgottenClient[]> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const oneMonthAgoStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const oneMonthAgoEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const threeMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  // 1. Find clients invoiced last month (M-1)
  const lastMonthInvoices = await prisma.invoice.groupBy({
    by: ['clientId'],
    where: {
      organizationId,
      status: { not: 'DRAFT' },
      issuedAt: { gte: oneMonthAgoStart, lte: oneMonthAgoEnd }
    },
    _count: { id: true }
  });

  const candidateClientIds = lastMonthInvoices.map(g => g.clientId);
  if (candidateClientIds.length === 0) return [];

  const forgottenClients: ForgottenClient[] = [];

  for (const clientId of candidateClientIds) {
    // Check current month (M)
    const currentMonthInvoice = await prisma.invoice.findFirst({
        where: {
            organizationId,
            clientId,
            status: { not: 'DRAFT' },
            issuedAt: { gte: currentMonthStart }
        }
    });

    if (!currentMonthInvoice) {
        // Check if regular: verify at least one invoice in (M-2 or M-3)
        // This confirms it's likely a monthly thing, not just a one-off last month
        const historyInvoice = await prisma.invoice.findFirst({
            where: {
                organizationId,
                clientId,
                status: { not: 'DRAFT' },
                issuedAt: { gte: threeMonthsAgoStart, lt: oneMonthAgoStart }
            }
        });

        if (historyInvoice) {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { id: true, name: true }
            });
            
            if (client) {
                // Get last invoice date
                const lastInvoice = await prisma.invoice.findFirst({
                    where: { organizationId, clientId, status: { not: 'DRAFT' } },
                    orderBy: { issuedAt: 'desc' }
                });

                forgottenClients.push({
                    id: client.id,
                    name: client.name,
                    lastInvoiceDate: lastInvoice?.issuedAt || oneMonthAgoEnd,
                    frequency: "Pravděpodobně měsíčně"
                });
            }
        }
    }
  }

  return forgottenClients;
}
