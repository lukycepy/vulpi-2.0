"use server";

import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function createExpense(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageExpenses = await hasPermission(user.id, orgId, "manage_expenses");
  if (!canManageExpenses) throw new Error("Nemáte oprávnění pro správu výdajů.");

  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const currency = formData.get("currency") as string;
  const date = new Date(formData.get("date") as string);
  const categoryId = formData.get("categoryId") as string;
  const supplierName = formData.get("supplierName") as string;
  const supplierId = formData.get("supplierId") as string;
  
  const file = formData.get("receipt") as File | null;
  let receiptUrl = "";

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, fileName), buffer);
        receiptUrl = `/uploads/${fileName}`;
    } catch (e) {
        console.error("Failed to upload file", e);
    }
  }

  await prisma.expense.create({
    data: {
      organizationId: orgId,
      description,
      amount,
      currency,
      date,
      categoryId: categoryId || null,
      supplierName,
      supplierId,
      receiptUrl: receiptUrl || null,
    },
  });

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error("Expense not found");

  const canManageExpenses = await hasPermission(user.id, expense.organizationId, "manage_expenses");
  if (!canManageExpenses) throw new Error("Nemáte oprávnění pro správu výdajů.");

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}

export async function createCategory(name: string, color: string) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;
  
  const canManageExpenses = await hasPermission(user.id, orgId, "manage_expenses");
  if (!canManageExpenses) throw new Error("Nemáte oprávnění pro správu výdajů.");

  await prisma.expenseCategory.create({
    data: {
      organizationId: orgId,
      name,
      color,
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/expenses/categories");
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const category = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!category) throw new Error("Category not found");
  
  const canManageExpenses = await hasPermission(user.id, category.organizationId, "manage_expenses");
  if (!canManageExpenses) throw new Error("Nemáte oprávnění pro správu výdajů.");

  await prisma.expenseCategory.delete({ where: { id } });
  revalidatePath("/expenses");
}
