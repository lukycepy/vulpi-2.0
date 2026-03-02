"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { triggerWebhook, sendDiscordNotification, sendNotificationWebhook } from "@/services/webhook";
// import { generateInvoicePdfBuffer } from "@/lib/pdf-server";
// import { uploadToCloudStorage } from "@/lib/cloud-storage";
// import { syncInvoiceToCloud } from "@/services/integrations/cloudSync";

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  discount: number;
  totalAmount: number;
  sku?: string;
  weightKg?: number;
}

// Helper to calculate totals consistently
function calculateInvoiceTotals(items: InvoiceItemData[], vatMode: string = "STANDARD", documentDiscount: number = 0, isVatInclusive: boolean = false) {
  let totalBase = 0;
  let totalVat = 0;
  
  // Recalculate each item to ensure data integrity
  const calculatedItems = items.map(item => {
    let baseAmount = 0;
    let itemVat = 0;
    
    if (isVatInclusive) {
      // Top-down calculation (Price includes VAT)
      // item.unitPrice is price with VAT
      const quantity = item.quantity;
      const unitPriceWithVat = item.unitPrice;
      
      const totalWithVat = quantity * unitPriceWithVat;
      // Discount is percentage off the total price
      const discountAmount = totalWithVat * (item.discount / 100);
      const totalWithVatAfterDiscount = totalWithVat - discountAmount;
      
      if (["NON_PAYER", "REVERSE_CHARGE", "IDENTIFIED_PERSON"].includes(vatMode)) {
        itemVat = 0;
        baseAmount = totalWithVatAfterDiscount;
      } else {
        // Calculate Base and VAT from Total
        // Total = Base * (1 + Rate/100)
        // Base = Total / (1 + Rate/100)
        const rate = item.vatRate;
        baseAmount = totalWithVatAfterDiscount / (1 + rate / 100);
        itemVat = totalWithVatAfterDiscount - baseAmount;
      }
    } else {
      // Bottom-up calculation (Standard, Price excludes VAT)
      const baseAmountRaw = item.quantity * item.unitPrice;
      const itemDiscountAmount = baseAmountRaw * (item.discount / 100);
      baseAmount = baseAmountRaw - itemDiscountAmount;
      
      if (["NON_PAYER", "REVERSE_CHARGE", "IDENTIFIED_PERSON"].includes(vatMode)) {
        itemVat = 0;
      } else {
        itemVat = baseAmount * (item.vatRate / 100);
      }
    }
    
    totalBase += baseAmount;
    totalVat += itemVat;
    
    return {
      ...item,
      totalAmount: baseAmount, // Store Net Amount
    };
  });
  
  // Apply document level discount (percentage)
  const totalDiscountAmount = totalBase * (documentDiscount / 100);
  const finalBase = totalBase - totalDiscountAmount;
  
  // Apply discount to VAT as well
  const finalVat = totalVat * (1 - documentDiscount / 100);
  
  // Phase 30: Rounding Rules
  let totalAmount = finalBase + finalVat;
  
  return {
    items: calculatedItems,
    totalBase: finalBase, // Net total
    totalAmount,
    totalVat: finalVat,
    totalDiscount: totalDiscountAmount
  };
}

export async function togglePinInvoice(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error("Invoice not found");

    const canManage = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
    if (!canManage) throw new Error("Forbidden");

    await prisma.invoice.update({
      where: { id },
      data: { isPinned: !invoice.isPinned },
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to toggle pin" };
  }
}

export async function createInvoice(data: any) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Nejste přihlášen");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true }
  });

  if (!membership) {
    throw new Error("Nejste členem žádné organizace");
  }

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
  if (!hasAccess) {
    throw new Error("Nemáte oprávnění vytvářet faktury");
  }

  // Validate inputs
  if (!data.clientId || !data.items || data.items.length === 0) {
    throw new Error("Chybí povinné údaje (klient, položky)");
  }

  // Calculate totals
  const totals = calculateInvoiceTotals(
    data.items, 
    data.vatMode, 
    data.discount, 
    data.isVatInclusive
  );

  // Apply Rounding Rule from Organization Settings
  // @ts-ignore - Prisma types might be out of sync
  const roundingRule = membership.organization.roundingRule || "MATH_2";
  let finalTotal = totals.totalAmount;
  let roundingDiff = 0;

  if (roundingRule === "CEIL_0") {
      finalTotal = Math.ceil(totals.totalAmount);
      roundingDiff = finalTotal - totals.totalAmount;
  } else if (roundingRule === "MATH_0") {
      finalTotal = Math.round(totals.totalAmount);
      roundingDiff = finalTotal - totals.totalAmount;
  } else {
      // MATH_2 (Default) - already handled by float, but let's ensure 2 decimals
      // Actually floats can be messy.
      finalTotal = Math.round(totals.totalAmount * 100) / 100;
      roundingDiff = finalTotal - totals.totalAmount; // Should be negligible or 0
  }

  const invoiceItems = [...totals.items];
  if (Math.abs(roundingDiff) > 0.009) {
      invoiceItems.push({
          description: "Haléřové vyrovnání",
          quantity: 1,
          unit: "ks",
          unitPrice: roundingDiff,
          vatRate: 0,
          discount: 0,
          totalAmount: roundingDiff,
          sku: "ROUNDING"
      });
  }

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: membership.organizationId,
      clientId: data.clientId,
      number: data.number,
      type: data.type,
      status: "DRAFT", // Default status
      issuedAt: data.issuedAt,
      dueAt: data.dueAt,
      taxDate: data.taxDate, // DUZP
      currency: data.currency,
      language: data.language || "cs",
      exchangeRate: data.exchangeRate,
      notes: data.notes,
      bankDetailId: data.bankDetailId,
      vatMode: data.vatMode,
      isVatInclusive: data.isVatInclusive,
      discount: data.discount,
      relatedId: data.relatedId,
      
      totalAmount: finalTotal,
      totalVat: totals.totalVat,
      
      items: {
        create: invoiceItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          totalAmount: item.totalAmount,
          sku: item.sku,
          weightKg: item.weightKg
        }))
      },
      
      customFieldValues: {
        create: data.customFields?.map((cf: any) => ({
          definitionId: cf.fieldId,
          value: cf.value
        })) || []
      }
    }
  });

  // Handle cloud integrations
  // @ts-ignore
  if (membership.organization.cloudIntegrationGoogleDrive || 
      // @ts-ignore
      membership.organization.cloudIntegrationDropbox || 
      // @ts-ignore
      membership.organization.cloudIntegrationOneDrive) {
      
      // We need to generate PDF first
      // This might be slow for request, maybe offload to queue?
      // For now, let's do it async without awaiting if possible, or just await.
      try {
          // Re-fetch invoice with items
          // const fullInvoice = await prisma.invoice.findUnique({
          //    where: { id: invoice.id },
          //    include: { items: true, client: true, organization: true }
          // });
          
          // if (fullInvoice) {
          //    const pdfBuffer = await generateInvoicePdfBuffer(fullInvoice);
          //    await syncInvoiceToCloud(fullInvoice, pdfBuffer, membership.organization);
          // }
      } catch (e) {
          console.error("Cloud sync failed", e);
      }
  }

  // Handle Google Calendar Integration
  // @ts-ignore - Prisma types might be out of sync
  if (membership.organization.googleCalendarIntegration) {
      // Logic to add event to GCal...
      // This usually requires OAuth flow per user or service account.
      // We'll just log for now or create a "Todo"
      console.log("Should add to Google Calendar:", invoice.dueAt);
  }

  // Handle Webhook
  // @ts-ignore - Prisma types might be out of sync
  if (membership.organization.notificationWebhookUrl) {
      try {
          // @ts-ignore - Prisma types might be out of sync
          await fetch(membership.organization.notificationWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  event: 'invoice.created',
                  invoice: {
                      id: invoice.id,
                      number: invoice.number,
                      amount: invoice.totalAmount,
                      currency: invoice.currency
                  }
              })
          });
      } catch (e) {
          console.error("Webhook failed", e);
      }
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(id: string, data: any, lastUpdatedAt?: Date | string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Nejste přihlášen");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    throw new Error("Nejste členem žádné organizace");
  }
  
  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
  if (!hasAccess) {
    throw new Error("Nemáte oprávnění upravovat faktury");
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!existingInvoice || existingInvoice.organizationId !== membership.organizationId) {
    throw new Error("Faktura nenalezena nebo nemáte oprávnění");
  }

  // Optimistic Concurrency Control
  if (lastUpdatedAt) {
      const dbTime = new Date(existingInvoice.updatedAt).getTime();
      const clientTime = new Date(lastUpdatedAt).getTime();
      
      // Allow a small tolerance (e.g., 1000ms) for clock skew or precision loss
      if (Math.abs(dbTime - clientTime) > 1000 && dbTime > clientTime) {
          throw new Error("Konflikt: Tuto fakturu právě upravil jiný uživatel. Obnovte stránku pro načtení nejnovějších dat.");
      }
  }

  if (existingInvoice.isLocked) {
    throw new Error("Faktura je uzamčena a nelze ji upravovat");
  }

  // Calculate totals
  const { items: calculatedItems, totalAmount, totalVat } = calculateInvoiceTotals(
    data.items, 
    data.vatMode, 
    data.discount, 
    data.isVatInclusive
  );

  // Transaction to update invoice and items
  await prisma.$transaction(async (tx) => {
    // Delete existing items
    await tx.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });

    // Delete existing custom fields
    await tx.customFieldValue.deleteMany({
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
        taxDate: data.taxDate,
        currency: data.currency,
        language: data.language || "cs",
        exchangeRate: data.exchangeRate,
        notes: data.notes,
        bankDetailId: data.bankDetailId,
        vatMode: data.vatMode,
        isVatInclusive: data.isVatInclusive,
        discount: data.discount,
        relatedId: data.relatedId,
        
        totalAmount,
        totalVat,
        
        items: {
          create: calculatedItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            totalAmount: item.totalAmount,
            sku: item.sku,
            weightKg: item.weightKg
          }))
        },
        
        customFieldValues: {
            create: data.customFields?.map((cf: any) => ({
              fieldId: cf.fieldId,
              value: cf.value
            })) || []
        }
      }
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return id;
}

export async function deleteInvoice(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
        include: { organization: true }
    });
    
    if (!membership) throw new Error("No organization");

    if (membership.organization.isLegalHold) {
        throw new Error("Nelze smazat - aktivní Legal Hold");
    }

    // Check permissions...
    const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Forbidden");

    await prisma.invoice.delete({ where: { id } });
    revalidatePath("/invoices");
}

export async function generateNextInvoiceNumber(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { invoiceNumberFormat: true }
  });

  const format = org?.invoiceNumberFormat || "{YYYY}{NNN}";
  const year = new Date().getFullYear().toString();
  
  // Find last invoice for this year to increment
  const lastInvoice = await prisma.invoice.findFirst({
    where: { 
      organizationId,
      number: {
        contains: year // Simple heuristic
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Simple increment logic (can be improved based on format)
  // Assuming format contains {NNN}
  // This is a simplified version.
  
  let nextSeq = 1;
  if (lastInvoice) {
      // Try to extract number. 
      // If number is 2024001, we extract 001.
      // This requires robust parsing which is complex.
      // For now, let's assume we just increment the count of invoices for this year + 1
      const count = await prisma.invoice.count({
          where: {
              organizationId,
              createdAt: {
                  gte: new Date(new Date().getFullYear(), 0, 1)
              }
          }
      });
      nextSeq = count + 1;
  }

  const seqStr = nextSeq.toString().padStart(3, '0');
  return format.replace("{YYYY}", year).replace("{NNN}", seqStr);
}

export async function bulkMarkAsPaid(invoiceIds: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Nejste přihlášen");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    throw new Error("Nejste členem žádné organizace");
  }

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
  if (!hasAccess) {
    throw new Error("Nemáte oprávnění spravovat faktury");
  }

  await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
      organizationId: membership.organizationId,
      status: { not: "PAID" }
    },
    data: {
      status: "PAID",
      updatedAt: new Date()
    }
  });

  revalidatePath("/invoices");
  return { success: true };
}



export async function getInvoicesForExport(invoiceIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("No organization");

  const invoices = await prisma.invoice.findMany({
    where: {
      id: { in: invoiceIds },
      organizationId: membership.organizationId
    },
    include: {
      organization: true,
      client: true,
      items: true,
      bankDetail: true,
      template: true,
    }
  });

  return invoices;
}

import { triggerWebhook, sendNotificationWebhook } from "@/services/webhook";

export async function addPartialPayment(invoiceId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("Nejste členem žádné organizace");

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
  if (!hasAccess) throw new Error("Nemáte oprávnění upravovat faktury");

  // Use raw SQL to get current values because Prisma Client is outdated
  // We need to cast to any[] because $queryRaw returns unknown
  const invoices = await prisma.$queryRaw<any[]>`SELECT * FROM "Invoice" WHERE "id" = ${invoiceId}`;
  const invoice = invoices[0];

  if (!invoice || invoice.organizationId !== membership.organizationId) {
    throw new Error("Faktura nenalezena nebo nemáte oprávnění");
  }

  // SQLite stores boolean as 0/1, Prisma maps it to boolean. Raw query might return 0/1.
  const isLocked = invoice.isLocked === true || invoice.isLocked === 1;

  if (isLocked) {
     throw new Error("Faktura je uzamčena a nelze ji upravovat");
  }

  const currentPaid = invoice.paidAmount || 0;
  const newPaid = currentPaid + amount;
  let status = invoice.status;
  let overpayment = invoice.overpaymentAmount || 0;
  const totalAmount = invoice.totalAmount;

  if (newPaid >= totalAmount - 0.01) {
      status = "PAID";
      if (newPaid > totalAmount) {
          overpayment = newPaid - totalAmount;
      }
  } else if (newPaid > 0.01 && status !== "DRAFT") {
      status = "PARTIAL";
  }

  // Use raw SQL to update
  await prisma.$executeRaw`
    UPDATE "Invoice" 
    SET "paidAmount" = ${newPaid}, 
        "status" = ${status}, 
        "overpaymentAmount" = ${overpayment}, 
        "updatedAt" = ${new Date()}
    WHERE "id" = ${invoiceId}
  `;

  if (status === "PAID") {
    // Fetch fresh invoice data for webhook payload
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true, client: true }
    });
    if (updatedInvoice) {
      await triggerWebhook(membership.organizationId, "INVOICE_PAID", updatedInvoice);

      // Custom Notification Webhook
      if (updatedInvoice.organization.notificationWebhookUrl) {
          const message = `💰 Faktura #${updatedInvoice.number} od klienta ${updatedInvoice.client.name} byla právě uhrazena!`;
          await sendNotificationWebhook(updatedInvoice.organization.notificationWebhookUrl, message);
      }
    }
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function toggleInvoiceLock(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nejste přihlášen");

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
    });

    if (!membership) throw new Error("Nejste členem žádné organizace");

    const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Nemáte oprávnění upravovat faktury");

    const invoice = await prisma.invoice.findUnique({
        where: { id }
    });

    if (!invoice || invoice.organizationId !== membership.organizationId) {
        throw new Error("Faktura nenalezena nebo nemáte oprávnění");
    }

    await prisma.invoice.update({
        where: { id },
        data: { isLocked: !invoice.isLocked }
    });

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    return { success: true };
}

export async function updateInvoiceStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("Nejste členem žádné organizace");

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_invoices");
  if (!hasAccess) throw new Error("Nemáte oprávnění upravovat faktury");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      organization: true,
      client: true,
      items: true,
      bankDetail: true,
      template: true, // Need to include template for PDF
    }
  });

  if (!invoice || invoice.organizationId !== membership.organizationId) {
    throw new Error("Faktura nenalezena nebo nemáte oprávnění");
  }

  if (invoice.isLocked) {
     throw new Error("Faktura je uzamčena a nelze ji upravovat");
  }
  
  // Update status
  await prisma.invoice.update({
    where: { id },
    data: { 
        status,
        updatedAt: new Date(),
    }
  });

  // Cloud Export Hook
  if (status === "ISSUED") {
     try {
        if (invoice.organization.cloudIntegrationGoogleDrive || 
            invoice.organization.cloudIntegrationDropbox || 
            invoice.organization.cloudIntegrationOneDrive) {

            console.log(`[Cloud Export] Invoice ${id} issued. Preparing export...`);
            
            // Generate PDF
            const pdfBuffer = await generateInvoicePdfBuffer({
                invoice: invoice,
                organization: invoice.organization,
                client: invoice.client,
                bankDetail: invoice.bankDetail,
                qrCodeUrl: undefined // Optional, skipped for now
            });
            
            // Sync
            await syncInvoiceToCloud(invoice, pdfBuffer);
        }
     } catch (error) {
         console.error(`[Cloud Export] Failed to export invoice ${id}:`, error);
         // Non-blocking error
     }
  }

  // Webhook for PAID status
  if (status === "PAID") {
      try {
        // Standard webhook
        await triggerWebhook(membership.organizationId, "INVOICE_PAID", { ...invoice, status: "PAID" });
        
        // Custom notification webhook
        if (invoice.organization.notificationWebhookUrl) {
            const message = `💰 Faktura #${invoice.number} od klienta ${invoice.client.name} byla právě uhrazena!`;
            await sendNotificationWebhook(invoice.organization.notificationWebhookUrl, message);
        }
      } catch (e) {
          console.error("Failed to trigger PAID webhook:", e);
      }
  }

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { success: true };
}
