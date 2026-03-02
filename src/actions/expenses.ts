"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { revalidatePath } from "next/cache";
import { getOcrProvider } from "@/lib/ocr/factory";

export async function getFlatRateData(year: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  // Use raw SQL to get paid invoices for the year because Prisma Client might be outdated
  // We need paidAmount (which might be null, default 0) and totalAmount
  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

  // SQLite date comparison
  const invoices = await prisma.$queryRaw<any[]>`
    SELECT "totalAmount", "paidAmount", "status"
    FROM "Invoice"
    WHERE "organizationId" = ${orgId}
    AND "status" = 'PAID'
    AND "issuedAt" >= ${startDate}
    AND "issuedAt" <= ${endDate}
  `;

  let totalIncome = 0;
  for (const invoice of invoices) {
    // If paidAmount is set, use it. Otherwise use totalAmount (fallback)
    const paid = invoice.paidAmount !== null ? invoice.paidAmount : invoice.totalAmount;
    totalIncome += paid;
  }

  return { totalIncome, year };
}

export async function createExpense(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Nejste členem žádné organizace");

  const description = formData.get("description") as string;
  const supplierName = formData.get("supplierName") as string || ""; 
  const amountStr = formData.get("amount") as string;
  const currency = formData.get("currency") as string || "CZK";
  const dateStr = formData.get("date") as string;
  const categoryId = formData.get("categoryId") as string || null;
  const projectId = formData.get("projectId") as string || null;
  const isSubcontractorCost = formData.get("isSubcontractorCost") === "true";
  const receiptFile = formData.get("receipt") as File;

  if (!description || !amountStr || !dateStr) {
    throw new Error("Missing required fields");
  }

  const amount = parseFloat(amountStr);
  const date = new Date(dateStr);

  // --- Duplicate Detection ---
  let possibleDuplicate = false;
  if (supplierName && amount > 0) {
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(date.getDate() - 7);
    
    const sevenDaysAfter = new Date(date);
    sevenDaysAfter.setDate(date.getDate() + 7);

    const duplicates = await prisma.expense.findMany({
        where: {
            organizationId: membership.organizationId,
            amount: amount,
            supplierName: supplierName,
            date: {
                gte: sevenDaysAgo,
                lte: sevenDaysAfter
            }
        }
    });

    if (duplicates.length > 0) {
        possibleDuplicate = true;
    }
  }
  // ---------------------------

  let receiptUrl = null;

  if (receiptFile && receiptFile.size > 0) {
    const uploadDir = join(process.cwd(), "public", "uploads", "expenses");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = receiptFile.name.split('.').pop() || 'bin';
    const filename = `expense-${uniqueSuffix}.${extension}`;
    const filepath = join(uploadDir, filename);
    
    const bytes = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    receiptUrl = `/uploads/expenses/${filename}`;
  }

  await prisma.expense.create({
    data: {
      organizationId: membership.organizationId,
      description, 
      supplierName: supplierName || null,
      amount,
      currency,
      date,
      categoryId,
      projectId,
      isSubcontractorCost,
      possibleDuplicate,
      receiptUrl
    }
  });

  revalidatePath("/expenses");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  
  return { possibleDuplicate };
}

export async function deleteExpense(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nejste přihlášeni.");

    const expense = await prisma.expense.findUnique({
        where: { id },
        include: { organization: true }
    });

    if (!expense) throw new Error("Náklad nenalezen");

    if (expense.organization.isLegalHold) {
        throw new Error("Nelze smazat - aktivní Legal Hold");
    }

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, organizationId: expense.organizationId }
    });

    if (!membership) throw new Error("Nejste členem organizace");

    await prisma.expense.delete({ where: { id } });
    revalidatePath("/expenses");
}

export async function suggestExpenseCategory(supplierName: string, description: string) {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const membership = await prisma.membership.findFirst({ where: { userId: user.id }});
    if (!membership) return null;

    // 1. Look for historical data for this supplier
    if (supplierName) {
        const lastExpense = await prisma.expense.findFirst({
            where: {
                organizationId: membership.organizationId,
                supplierName: supplierName,
                categoryId: { not: null }
            },
            orderBy: { date: 'desc' },
            select: { categoryId: true }
        });

        if (lastExpense?.categoryId) {
            return lastExpense.categoryId;
        }
    }

    // 2. Ask OCR Provider (AI) for suggestion
    const provider = getOcrProvider();
    const suggestedCategoryCode = await provider.suggestCategory(supplierName || "", description);

    const categories = await prisma.expenseCategory.findMany({
        where: { organizationId: membership.organizationId }
    });

    if (suggestedCategoryCode) {
        // Map codes to common Czech category names/keywords
        const codeToKeywords: Record<string, string[]> = {
            "HARDWARE": ["hardware", "pc", "počítač", "elektronika", "vybavení", "technika"],
            "HOSTING": ["hosting", "server", "cloud", "software", "saas", "doména"],
            "MARKETING": ["marketing", "reklama", "propagace", "fb", "google", "inzerce"],
            "FUEL": ["palivo", "benzín", "nafta", "phm", "auto", "pohonn", "čerpací"],
            "REFRESHMENT": ["občerstvení", "jídlo", "repre", "restaurace", "potraviny", "káva"],
            "PHONE_INTERNET": ["telefon", "internet", "mobil", "data", "volání", "o2", "t-mobile", "vodafone"],
            "OFFICE": ["kancelář", "papír", "potřeby", "nábytek", "pronájem"]
        };

        const keywords = codeToKeywords[suggestedCategoryCode] || [suggestedCategoryCode.toLowerCase()];

        // Try to find a category that matches the suggestion (by name or code if we had it)
        const match = categories.find(c => {
            const catName = c.name.toLowerCase();
            // Direct match
            if (catName === suggestedCategoryCode.toLowerCase()) return true;
            
            // Check keywords
            return keywords.some(k => catName.includes(k) || k.includes(catName));
        });

        if (match) return match.id;
    }

    // 3. Fallback: simple keyword matching locally
    const lowerDesc = description.toLowerCase();
    
    for (const cat of categories) {
        if (lowerDesc.includes(cat.name.toLowerCase())) {
            return cat.id;
        }
    }

    return null;
}

export async function createCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Nejste členem žádné organizace");

  const name = formData.get("name") as string;
  const color = formData.get("color") as string || "#6b7280"; // Default gray

  if (!name) {
    throw new Error("Název kategorie je povinný");
  }

  await prisma.expenseCategory.create({
    data: {
      organizationId: membership.organizationId,
      name,
      color
    }
  });

  revalidatePath("/expenses/categories");
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const category = await prisma.expenseCategory.findUnique({
    where: { id },
    include: { organization: true }
  });

  if (!category) throw new Error("Kategorie nenalezena");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: category.organizationId }
  });

  if (!membership) throw new Error("Nejste členem organizace");

  // Check if category is used
  const usedCount = await prisma.expense.count({
    where: { categoryId: id }
  });

  if (usedCount > 0) {
    throw new Error(`Kategorii nelze smazat, je použita u ${usedCount} výdajů.`);
  }

  await prisma.expenseCategory.delete({
    where: { id }
  });

  revalidatePath("/expenses/categories");
}
