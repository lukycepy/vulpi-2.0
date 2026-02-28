"use server";

import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage() {
  const categories = await prisma.expenseCategory.findMany();

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Nový výdaj</h1>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <ExpenseForm categories={categories} />
      </div>
    </div>
  );
}
