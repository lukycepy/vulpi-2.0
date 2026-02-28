"use server";

import { prisma } from "@/lib/prisma";
import { matchPayments } from "@/services/bank/matching";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function getBankMovements(organizationId: string, status?: string) {
  const user = await getCurrentUser();
  const canManageBank = await hasPermission(user.id, organizationId, "manage_bank");
  if (!canManageBank) throw new Error("Nemáte oprávnění pro zobrazení banky.");

  const where: any = {
    bankIntegration: {
      organizationId,
    },
  };

  if (status) {
    if (status === "PROPOSED") {
      where.status = { in: ["PROPOSED", "PROPOSED_MULTI"] };
    } else {
      where.status = status;
    }
  }

  const movements = await prisma.bankMovement.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      invoice: {
        include: {
          client: true,
        },
      },
      bankIntegration: true,
    },
  });

  return movements;
}

export async function runBankMatching() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageBank = await hasPermission(user.id, orgId, "manage_bank");
  if (!canManageBank) throw new Error("Nemáte oprávnění pro správu banky.");

  const count = await matchPayments(orgId);
  revalidatePath("/banking");
  return { success: true, count };
}

export async function confirmMatch(movementId: string, invoiceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageBank = await hasPermission(user.id, orgId, "manage_bank");
  if (!canManageBank) throw new Error("Nemáte oprávnění pro správu banky.");

  const movement = await prisma.bankMovement.findUnique({
    where: { id: movementId },
    include: { bankIntegration: true }
  });

  if (!movement) throw new Error("Movement not found");
  if (movement.bankIntegration.organizationId !== orgId) throw new Error("Access denied");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (invoice.organizationId !== orgId) throw new Error("Access denied");

  const currentPaid = invoice.paidAmount || 0;
  const newPaidAmount = currentPaid + movement.amount;
  const remaining = invoice.totalAmount - newPaidAmount;

  let invoiceStatus = invoice.status;
  let movementMessage = "Ručně spárováno";

  if (remaining < 0.01) {
    invoiceStatus = "PAID";
  } else {
    invoiceStatus = "PARTIAL";
    movementMessage = "Částečná úhrada (Ručně)";
  }

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: invoiceStatus,
        paidAmount: newPaidAmount,
      },
    }),
    prisma.bankMovement.update({
      where: { id: movementId },
      data: {
        status: "MATCHED",
        invoiceId: invoiceId,
        message: movementMessage,
      },
    }),
  ]);

  revalidatePath("/banking");
  return { success: true };
}

export async function ignoreMovement(movementId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageBank = await hasPermission(user.id, orgId, "manage_bank");
  if (!canManageBank) throw new Error("Nemáte oprávnění pro správu banky.");

  const movement = await prisma.bankMovement.findUnique({
    where: { id: movementId },
    include: { bankIntegration: true }
  });

  if (!movement) throw new Error("Movement not found");
  if (movement.bankIntegration.organizationId !== orgId) throw new Error("Access denied");

  await prisma.bankMovement.update({
    where: { id: movementId },
    data: { status: "IGNORED" },
  });
  revalidatePath("/banking");
  return { success: true };
}

export async function unmatchMovement(movementId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageBank = await hasPermission(user.id, orgId, "manage_bank");
  if (!canManageBank) throw new Error("Nemáte oprávnění pro správu banky.");

  const movement = await prisma.bankMovement.findUnique({
    where: { id: movementId },
    include: { bankIntegration: true }
  });

  if (!movement || !movement.invoiceId) throw new Error("Movement not matched");
  if (movement.bankIntegration.organizationId !== orgId) throw new Error("Access denied");

  const invoice = await prisma.invoice.findUnique({
    where: { id: movement.invoiceId },
  });

  if (invoice) {
    const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - movement.amount);
    const newStatus = newPaidAmount < 0.01 ? "ISSUED" : "PARTIAL"; // Simplified, ideally check due date for OVERDUE

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        paidAmount: newPaidAmount,
      },
    });
  }

  await prisma.bankMovement.update({
    where: { id: movementId },
    data: {
      status: "UNMATCHED",
      invoiceId: null,
      message: null,
    },
  });

  revalidatePath("/banking");
  return { success: true };
}
