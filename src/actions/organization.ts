"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { encryptString } from "@/lib/crypto";
import { syncBankMovements } from "@/services/bank/sync";
import { matchPayments } from "@/services/bank/matching";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function updateOrganization(data: {
  name: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  web?: string;
  email?: string;
  phone?: string;
  vatPayerStatus?: string;
  defaultVatMode?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageSettings = await hasPermission(user.id, orgId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.organization.update({
    where: { id: orgId },
    data,
  });

  revalidatePath("/settings/organization");
}

export async function addBankDetail(data: {
  bankName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  currency: string;
}) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageSettings = await hasPermission(user.id, orgId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankDetail.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });
  
  revalidatePath("/settings/organization");
}

export async function removeBankDetail(id: string) {
  const user = await getCurrentUser();
  const bankDetail = await prisma.bankDetail.findUnique({ where: { id } });
  if (!bankDetail) throw new Error("Bank detail not found");

  const canManageSettings = await hasPermission(user.id, bankDetail.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankDetail.delete({
    where: { id },
  });
  
  revalidatePath("/settings/organization");
}

export async function addBankIntegration(data: {
  provider: string;
  token: string;
  key?: string;
}) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageSettings = await hasPermission(user.id, orgId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankIntegration.create({
    data: {
      organizationId: orgId,
      provider: data.provider,
      encryptedToken: encryptString(data.token),
      encryptedKey: data.key ? encryptString(data.key) : null,
      isActive: true,
    },
  });

  revalidatePath("/settings/organization");
}

export async function removeBankIntegration(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const integration = await prisma.bankIntegration.findUnique({ where: { id } });
  if (!integration) throw new Error("Integration not found");

  const canManageSettings = await hasPermission(user.id, integration.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankIntegration.delete({
    where: { id },
  });

  revalidatePath("/settings/organization");
}

export async function toggleBankIntegration(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const integration = await prisma.bankIntegration.findUnique({ where: { id } });
  if (!integration) throw new Error("Integration not found");

  const canManageSettings = await hasPermission(user.id, integration.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankIntegration.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/settings/organization");
}

export async function syncBankNow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;
  
  const canManageSettings = await hasPermission(user.id, orgId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await syncBankMovements(orgId);
  await matchPayments(orgId);
  revalidatePath("/settings/organization");
}
