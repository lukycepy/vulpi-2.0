"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discount: number;
  totalAmount: number;
}

// Helper to calculate totals consistently
function calculateInvoiceTotals(items: InvoiceItemData[], vatMode: string = "STANDARD", documentDiscount: number = 0) {
  let totalBase = 0;
  let totalVat = 0;
  
  // Recalculate each item to ensure data integrity
  const calculatedItems = items.map(item => {
    const baseAmount = item.quantity * item.unitPrice;
    // item.discount is percentage
    const itemDiscountAmount = baseAmount * (item.discount / 100);
    const itemTotal = baseAmount - itemDiscountAmount;
    
    let itemVat = 0;
    
    if (["NON_PAYER", "REVERSE_CHARGE", "IDENTIFIED_PERSON"].includes(vatMode)) {
      itemVat = 0;
    } else {
      // STANDARD, OSS
      itemVat = itemTotal * (item.vatRate / 100);
    }
    
    totalBase += itemTotal;
    totalVat += itemVat;
    
    return {
      ...item,
      totalAmount: itemTotal, // Ensure stored amount is correct (Base - ItemDiscount)
    };
  });
  
  // Apply document level discount (percentage)
  const totalDiscountAmount = totalBase * (documentDiscount / 100);
  const finalBase = totalBase - totalDiscountAmount;
  
  // Apply discount to VAT as well
  const finalVat = totalVat * (1 - documentDiscount / 100);
  
  return {
    items: calculatedItems,
    totalAmount: finalBase + finalVat, // Grand Total (Base + VAT)
    totalVat: finalVat,
    totalDiscount: totalDiscountAmount
  };
}

export async function createInvoice(data: {
  clientId: string;
  number: string;
  type: string;
  issuedAt: Date;
  dueAt: Date;
  currency: string;
  items: InvoiceItemData[];
  notes?: string;
  bankDetailId?: string;
  vatMode?: string;
  exchangeRate?: number;
  discount?: number;
  relatedId?: string;
  customFields?: { fieldId: string; value: string }[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageInvoices = await hasPermission(user.id, orgId, "manage_invoices");
  if (!canManageInvoices) {
    throw new Error("Nemáte oprávnění vytvářet faktury.");
  }
  
  // Verify client belongs to organization
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  });
  
  if (!client || client.organizationId !== orgId) {
    throw new Error("Client not found or access denied");
  }

  // Verify bank detail belongs to organization
  if (data.bankDetailId) {
    const bankDetail = await prisma.bankDetail.findUnique({
      where: { id: data.bankDetailId }
    });
    if (!bankDetail || bankDetail.organizationId !== orgId) {
      throw new Error("Bank detail not found or access denied");
    }
  }

  const totals = calculateInvoiceTotals(data.items, data.vatMode, data.discount);
  
  // Approval Logic
  let status = "ISSUED";
  const approvalThreshold = 5000;
  const needsApproval = totals.totalAmount > approvalThreshold; // Simplified check (currency ignored for now)

  if (needsApproval) {
    const canApprove = await hasPermission(user.id, orgId, "approve_invoices");
    // If user can approve, they auto-approve their own invoice? 
    // Usually approval is for subordinates. But if I am admin/manager, I can just issue it.
    // Let's say if I have approve_invoices, I can bypass approval.
    if (!canApprove) {
      status = "PENDING_APPROVAL";
    }
  }

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: data.clientId,
      number: data.number,
      type: data.type,
      status: status,
      issuedAt: data.issuedAt,
      dueAt: data.dueAt,
      currency: data.currency,
      totalAmount: totals.totalAmount,
      totalVat: totals.totalVat,
      notes: data.notes,
      bankDetailId: data.bankDetailId,
      vatMode: data.vatMode || "STANDARD",
      exchangeRate: data.exchangeRate || 1,
      discount: data.discount || 0,
      totalDiscount: totals.totalDiscount,
      relatedId: data.relatedId,
      customFields: {
        create: data.customFields?.map(cf => ({
          fieldId: cf.fieldId,
          value: cf.value
        })) || []
      },
      items: {
        create: totals.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            totalAmount: item.totalAmount
          }))
      }
    }
  });

  if (needsApproval && user) {
    await prisma.approvalRequest.create({
      data: {
        invoiceId: invoice.id,
        requesterId: user.id,
        status: "PENDING"
      }
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/");
  return invoice.id;
}

export async function updateInvoice(id: string, data: {
  clientId: string;
  number: string;
  type: string;
  issuedAt: Date;
  dueAt: Date;
  currency: string;
  items: InvoiceItemData[];
  notes?: string;
  bankDetailId?: string;
  vatMode?: string;
  exchangeRate?: number;
  discount?: number;
  relatedId?: string;
  customFields?: { fieldId: string; value: string }[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!invoice) throw new Error("Invoice not found");
  
  const canManageInvoices = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) throw new Error("Nemáte oprávnění upravovat faktury.");

  if (invoice.isLocked) throw new Error("Invoice is locked");

  // Verify client belongs to organization
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  });
  
  if (!client || client.organizationId !== invoice.organizationId) {
    throw new Error("Client not found or access denied");
  }

  // Verify bank detail belongs to organization
  if (data.bankDetailId) {
    const bankDetail = await prisma.bankDetail.findUnique({
      where: { id: data.bankDetailId }
    });
    if (!bankDetail || bankDetail.organizationId !== invoice.organizationId) {
      throw new Error("Bank detail not found or access denied");
    }
  }

  const totals = calculateInvoiceTotals(data.items, data.vatMode, data.discount);

  // Transaction to update invoice and replace items
  await prisma.$transaction(async (tx) => {
    // Delete existing items and custom fields
    await tx.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });
    
    // We also need to delete existing custom fields to replace them
    // Note: This is simple replacement strategy.
    // If we wanted to keep history or audit, we might need a different approach.
    await tx.invoiceCustomFieldValue.deleteMany({
      where: { invoiceId: id }
    });

    // Update invoice
    await tx.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId,
        number: data.number,
        type: data.type,
        issuedAt: data.issuedAt,
        dueAt: data.dueAt,
        currency: data.currency,
        totalAmount: totals.totalAmount,
        totalVat: totals.totalVat,
        notes: data.notes,
        bankDetailId: data.bankDetailId,
        vatMode: data.vatMode || "STANDARD",
        exchangeRate: data.exchangeRate || 1,
        discount: data.discount || 0,
        totalDiscount: totals.totalDiscount,
        relatedId: data.relatedId,
        customFields: {
          create: data.customFields?.map(cf => ({
            fieldId: cf.fieldId,
            value: cf.value
          })) || []
        },
        items: {
          create: totals.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            totalAmount: item.totalAmount,
          })),
        },
      }
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return id;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");

  const canManageInvoices = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) throw new Error("Nemáte oprávnění upravovat faktury.");

  await prisma.invoice.update({
    where: { id },
    data: { status }
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function toggleInvoiceLock(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");

  const canManageInvoices = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) throw new Error("Nemáte oprávnění upravovat faktury.");

  await prisma.invoice.update({
    where: { id },
    data: { isLocked: !invoice.isLocked }
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found");
  
  const canManageInvoices = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) throw new Error("Nemáte oprávnění mazat faktury.");

  if (invoice.isLocked) throw new Error("Invoice is locked");

  await prisma.invoice.delete({
    where: { id }
  });
  revalidatePath("/invoices");
  revalidatePath("/");
}
