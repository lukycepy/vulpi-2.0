"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Nejste členem žádné organizace");

  const categories = await prisma.expenseCategory.findMany({
    where: { organizationId: membership.organizationId }
  });
  
  const projects = await prisma.project.findMany({
    where: { organizationId: membership.organizationId, status: "ACTIVE" },
    select: { id: true, name: true }
  });

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Nový výdaj</h1>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <ExpenseForm categories={categories} projects={projects} />
      </div>
    </div>
  );
}
