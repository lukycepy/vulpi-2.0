"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { triggerWebhook, sendDiscordNotification } from "@/services/webhook";

export async function approveInvoice(requestId: string, note?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");

  if (request.entityType !== "INVOICE") {
    throw new Error("Tento požadavek není pro fakturu.");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: request.entityId },
  });

  if (!invoice) throw new Error("Faktura nenalezena.");

  const canApprove = await hasPermission(user.id, invoice.organizationId, "approve_invoices");
  if (!canApprove) {
    throw new Error("Nemáte oprávnění schvalovat faktury.");
  }

  // Fetch organization to check webhooks
  const organization = await prisma.organization.findUnique({
    where: { id: invoice.organizationId },
    select: { notificationWebhookUrl: true }
  });

  // Fetch client name for notification
  const client = await prisma.client.findUnique({
    where: { id: invoice.clientId },
    select: { name: true }
  });

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approverId: user.id,
        comment: note
      }
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ISSUED" 
      }
    })
  ]);

  // Notifications
  try {
    await triggerWebhook(invoice.organizationId, "INVOICE_APPROVED", {
      invoiceId: invoice.id,
      number: invoice.number,
      approverId: user.id,
      timestamp: new Date().toISOString()
    });

    if (organization?.notificationWebhookUrl) {
      await sendDiscordNotification(
        organization.notificationWebhookUrl, 
        invoice, 
        client?.name || "Neznámý klient"
      );
    }
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}

export async function rejectInvoice(requestId: string, note?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Request not found");

  if (request.entityType !== "INVOICE") {
    throw new Error("Tento požadavek není pro fakturu.");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: request.entityId },
  });

  if (!invoice) throw new Error("Faktura nenalezena.");

  const canApprove = await hasPermission(user.id, invoice.organizationId, "approve_invoices");
  if (!canApprove) {
    throw new Error("Nemáte oprávnění zamítat faktury.");
  }

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approverId: user.id,
        comment: note
      }
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "DRAFT" 
      }
    })
  ]);

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}
