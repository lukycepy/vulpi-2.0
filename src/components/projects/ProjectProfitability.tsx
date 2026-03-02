
"use client";

import { Project, Invoice, Expense, TimeEntry } from "@prisma/client";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ProjectProfitabilityProps {
  project: Project & {
    invoices: Invoice[];
    expenses: Expense[];
    timeEntries: TimeEntry[];
  };
  userRates: Record<string, number>;
}

export function ProjectProfitability({ project, userRates }: ProjectProfitabilityProps) {
  // 1. Calculate Revenue (Only PAID invoices)
  const revenue = project.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // 2. Calculate Expenses (Split into Subcontractor and Other)
  const subcontractorExpenses = project.expenses
    .filter((exp) => exp.isSubcontractorCost)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const otherExpenses = project.expenses
    .filter((exp) => !exp.isSubcontractorCost)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalDirectExpenses = subcontractorExpenses + otherExpenses;

  // 3. Calculate Labor Costs (Time Entries * User Hourly Rate)
  const laborCosts = project.timeEntries.reduce((sum, entry) => {
    let durationSeconds = entry.duration || 0;
    if (!durationSeconds && entry.endTime) {
      durationSeconds = Math.floor(
        (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000
      );
    }
    const hours = durationSeconds / 3600;
    const rate = userRates[entry.userId] || 0;
    return sum + (hours * rate);
  }, 0);

  // 4. Total Costs and Profit
  const totalCosts = totalDirectExpenses + laborCosts;
  const profit = revenue - totalCosts;
  const marginPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Chart Data
  const costBreakdownData = [
    { name: "Práce (Interní)", value: laborCosts, color: "#3b82f6" }, // blue-500
    { name: "Subdodávky", value: subcontractorExpenses, color: "#f59e0b" }, // amber-500
    { name: "Ostatní náklady", value: otherExpenses, color: "#ef4444" }, // red-500
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové příjmy</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</div>
            <p className="text-xs text-muted-foreground">
              Z uhrazených faktur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové náklady</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCosts)}</div>
            <p className="text-xs text-muted-foreground">
              Práce + výdaje + subdodávky
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zisk</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Příjmy mínus náklady
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marže</CardTitle>
            {marginPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${marginPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {marginPercentage.toFixed(1)} %
            </div>
            <Progress value={Math.max(0, Math.min(100, marginPercentage))} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Rozpad nákladů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {costBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: any) => formatCurrency(Number(value) || 0)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Žádné náklady k zobrazení
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Detailní přehled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Příjmy (Uhrazeno)</span>
                    <span className="font-bold text-green-600">{formatCurrency(revenue)}</span>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Interní práce ({Math.round(laborCosts > 0 ? project.timeEntries.length : 0)} záznamů)</span>
                        <span>{formatCurrency(laborCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subdodávky</span>
                        <span>{formatCurrency(subcontractorExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Ostatní náklady</span>
                        <span>{formatCurrency(otherExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t font-medium">
                        <span>Celkové náklady</span>
                        <span className="text-red-600">{formatCurrency(totalCosts)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-b bg-muted/20 px-4 rounded-md">
                    <span className="font-bold text-lg">Čistý zisk</span>
                    <span className={`font-bold text-lg ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(profit)}
                    </span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
