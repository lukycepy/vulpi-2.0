"use server";

import { prisma } from "@/lib/prisma";
import { generateISDOC } from "@/lib/exports/isdoc";
import { generatePohoda, generatePohodaBatch } from "@/lib/exports/pohoda";
import { generateMoneyS3, generateMoneyS3Batch } from "@/lib/exports/money";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function exportInvoice(invoiceId: string, format: "ISDOC" | "POHODA" | "MONEY") {
  const user = await getCurrentUser();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      organization: true,
      client: true,
      items: true,
      bankDetail: true
    }
  });

  if (!invoice) throw new Error("Faktura nenalezena");

  // Check permission
  const canView = await hasPermission(user.id, invoice.organizationId, "view_dashboard"); // Minimal permission to view invoices? 
  // Ideally we should have view_invoices. Let's use manage_invoices or check if they are in the org.
  // Actually, let's just check membership in the organization.
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: invoice.organizationId }
  });

  if (!membership) {
    throw new Error("Nemáte přístup k této faktuře.");
  }

  let content = "";
  let filename = "";

  switch (format) {
    case "ISDOC":
      content = generateISDOC(invoice);
      filename = `faktura-${invoice.number}.isdoc`;
      break;
    case "POHODA":
      content = generatePohoda(invoice);
      filename = `faktura-${invoice.number}-pohoda.xml`;
      break;
    case "MONEY":
      content = generateMoneyS3(invoice);
      filename = `faktura-${invoice.number}-money.xml`;
      break;
  }

  return { content, filename };
}

export async function exportFilteredInvoices(
  organizationId: string,
  searchParams: { query?: string; status?: string },
  format: "ISDOC" | "POHODA" | "MONEY"
) {
  const user = await getCurrentUser();
  
  // Check access to organization
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId }
  });

  if (!membership) {
    throw new Error("Nemáte přístup k této organizaci.");
  }

  const query = searchParams.query || "";
  const status = searchParams.status || "ALL";

  const where: any = {
    organizationId, // IMPORTANT: Filter by organization
  };

  if (query) {
    where.OR = [
      { number: { contains: query } },
      { client: { name: { contains: query } } },
    ];
  }

  if (status && status !== "ALL") {
    if (status === "OVERDUE") {
      where.status = { notIn: ["PAID", "CANCELLED"] };
      where.dueAt = { lt: new Date() };
    } else {
      where.status = status;
    }
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      organization: true,
      client: true,
      items: true,
      bankDetail: true,
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  if (invoices.length === 0) {
    throw new Error("Nebyly nalezeny žádné faktury k exportu.");
  }

  let content = "";
  let filename = "";

  switch (format) {
    case "ISDOC":
      // ISDOC doesn't support batching in a single file easily without ZIP.
      // For now, we'll export the first one or throw.
      // Better: Throw error explaining limitation.
      throw new Error("Hromadný export do ISDOC není podporován (pouze po jedné faktuře).");
      
    case "POHODA":
      content = generatePohodaBatch(invoices);
      filename = `export-faktur-pohoda-${new Date().toISOString().split('T')[0]}.xml`;
      break;
      
    case "MONEY":
      content = generateMoneyS3Batch(invoices);
      filename = `export-faktur-money-${new Date().toISOString().split('T')[0]}.xml`;
      break;
  }

  return { content, filename };
}
