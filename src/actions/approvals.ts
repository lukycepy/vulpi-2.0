"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function approveInvoice(requestId: string, note?: string) {
  const user = await getCurrentUser();
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { invoice: true }
  });

  if (!request) throw new Error("Request not found");

  const canApprove = await hasPermission(user.id, request.invoice.organizationId, "approve_invoices");
  if (!canApprove) {
    throw new Error("Nemáte oprávnění schvalovat faktury.");
  }

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approverId: user.id,
        note
      }
    }),
    prisma.invoice.update({
      where: { id: request.invoiceId },
      data: {
        status: "ISSUED" 
      }
    })
  ]);

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}

export async function rejectInvoice(requestId: string, note?: string) {
  const user = await getCurrentUser();
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { invoice: true }
  });

  if (!request) throw new Error("Request not found");

  const canApprove = await hasPermission(user.id, request.invoice.organizationId, "approve_invoices");
  if (!canApprove) {
    throw new Error("Nemáte oprávnění zamítat faktury.");
  }

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approverId: user.id,
        note
      }
    }),
    prisma.invoice.update({
      where: { id: request.invoiceId },
      data: {
        status: "DRAFT" 
      }
    })
  ]);

  revalidatePath("/approvals");
  revalidatePath("/invoices");
}
