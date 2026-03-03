"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { triggerWebhook, sendDiscordNotification } from "@/services/webhook";

export async function getPendingApprovals(userId: string) {
  // Find organizations where user has approve permission
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true }
  });

  const approvableOrgIds = [];
  for (const m of memberships) {
    if (await hasPermission(userId, m.organizationId, "approve_invoices")) {
      approvableOrgIds.push(m.organizationId);
    }
  }

  if (approvableOrgIds.length === 0) return [];

  return await prisma.approvalRequest.findMany({
    where: {
      status: "PENDING",
      invoice: {
        organizationId: { in: approvableOrgIds }
      }
    },
    include: {
      invoice: {
        include: {
          client: true,
          organization: true
        }
      },
      requester: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function approveDocument(approvalId: string, approverId: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { invoice: true }
  });

  if (!request) throw new Error("Žádost nenalezena.");
  if (request.status !== "PENDING") throw new Error("Žádost již byla zpracována.");

  const hasAccess = await hasPermission(approverId, request.invoice.organizationId, "approve_invoices");
  if (!hasAccess) throw new Error("Nemáte oprávnění schvalovat faktury.");

  // Fetch client for notification
  const client = await prisma.client.findUnique({
      where: { id: request.invoice.clientId },
      select: { name: true }
  });
  
  // Fetch organization settings
  const organization = await prisma.organization.findUnique({
      where: { id: request.invoice.organizationId },
      select: { notificationWebhookUrl: true }
  });

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        approverId,
        updatedAt: new Date()
      }
    }),
    prisma.invoice.update({
      where: { id: request.invoiceId },
      data: { status: "ISSUED" }
    })
  ]);

  // Notifications
  try {
    await triggerWebhook(request.invoice.organizationId, "INVOICE_APPROVED", {
      invoiceId: request.invoice.id,
      number: request.invoice.number,
      approverId,
      timestamp: new Date().toISOString()
    });

    if (organization?.notificationWebhookUrl) {
      await sendDiscordNotification(
        organization.notificationWebhookUrl, 
        request.invoice, 
        client?.name || "Neznámý klient"
      );
    }
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}

export async function rejectDocument(approvalId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const request = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { invoice: true }
  });

  if (!request) throw new Error("Žádost nenalezena.");
  if (request.status !== "PENDING") throw new Error("Žádost již byla zpracována.");

  const hasAccess = await hasPermission(user.id, request.invoice.organizationId, "approve_invoices");
  if (!hasAccess) throw new Error("Nemáte oprávnění zamítat faktury.");

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        approverId: user.id,
        note,
        updatedAt: new Date()
      }
    }),
    prisma.invoice.update({
      where: { id: request.invoiceId },
      data: { status: "DRAFT" } // Return to draft
    })
  ]);

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}
