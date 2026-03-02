
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { YearInReview } from "@/components/reports/YearInReview";

export default async function YearInReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true }
  });

  if (!membership) {
    redirect("/login");
  }

  // Calculate statistics for the current year (or previous if viewed in Jan)
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const targetYear = currentMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
  
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  // 1. Total Revenue
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: membership.organizationId,
      issuedAt: {
        gte: startDate,
        lte: endDate
      },
      status: { not: "DRAFT" } // Only issued invoices
    },
    include: {
      client: true,
      items: true
    }
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  // 2. Best Month
  const revenueByMonth = new Array(12).fill(0);
  invoices.forEach(inv => {
    const month = new Date(inv.issuedAt).getMonth();
    revenueByMonth[month] += inv.totalAmount;
  });
  
  const bestMonthIndex = revenueByMonth.indexOf(Math.max(...revenueByMonth));
  const monthNames = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen", 
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];
  const bestMonth = {
    name: monthNames[bestMonthIndex],
    amount: revenueByMonth[bestMonthIndex]
  };

  // 3. Best Client
  const clientRevenue: Record<string, { name: string, amount: number }> = {};
  invoices.forEach(inv => {
    if (!inv.clientId) return;
    if (!clientRevenue[inv.clientId]) {
      clientRevenue[inv.clientId] = { name: inv.client?.name || "Neznámý", amount: 0 };
    }
    clientRevenue[inv.clientId].amount += inv.totalAmount;
  });

  const bestClientEntry = Object.values(clientRevenue).sort((a, b) => b.amount - a.amount)[0];
  const bestClient = bestClientEntry || { name: "Zatím žádný", amount: 0 };

  // 4. Coffee Estimate (Fun metric: 1 invoice = 2 coffees, or based on working hours if we had them)
  // Let's say 1 invoice = 3 coffees (preparation + execution + administration)
  const coffeeCount = invoices.length * 3;

  const stats = {
    year: targetYear,
    totalRevenue,
    currency: "CZK",
    bestMonth,
    bestClient,
    coffeeCount,
    invoiceCount: invoices.length
  };

  return (
    <div className="container mx-auto py-10">
      <YearInReview stats={stats} />
    </div>
  );
}
