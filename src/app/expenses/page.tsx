import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Trash2, FileText, Tag, Calendar, Building2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteExpense } from "@/actions/expenses";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  
  const orgId = membership.organizationId;
  const canManageExpenses = await hasPermission(user.id, orgId, "manage_expenses");

  if (!canManageExpenses) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu výdajů.
        </div>
      </div>
    );
  }

  const expenses = await prisma.expense.findMany({
    where: { organizationId: orgId },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const categories = await prisma.expenseCategory.findMany({
    where: { organizationId: orgId },
  });

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Výdaje</h1>
          <p className="text-muted-foreground mt-1">Evidence přijatých faktur a nákladů</p>
        </div>
        <div className="flex gap-2">
            <Link href="/expenses/categories" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Kategorie
            </Link>
            <Link href="/expenses/new" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Nový výdaj
            </Link>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Datum</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Popis</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dodavatel</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kategorie</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Částka</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Akce</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    Žádné výdaje k zobrazení
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">{formatDate(expense.date)}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        {expense.receiptUrl && <FileText className="w-4 h-4 mr-2 text-blue-500" />}
                        {expense.description}
                      </div>
                    </td>
                    <td className="p-4 align-middle">{expense.supplierName || "-"}</td>
                    <td className="p-4 align-middle">
                      {expense.category ? (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: expense.category.color + '20', color: expense.category.color }}
                        >
                          {expense.category.name}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <form action={async () => {
                        "use server";
                        await deleteExpense(expense.id);
                      }}>
                        <button className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
