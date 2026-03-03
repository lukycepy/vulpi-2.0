"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { encryptString } from "@/lib/crypto";
import { syncBankMovements } from "@/services/bank/sync";
import { matchPayments } from "@/services/bank/matching";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function updateOrganization(data: {
  name?: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  web?: string;
  email?: string;
  phone?: string;
  vatPayerStatus?: string;
  defaultVatMode?: string;
  isLegalHold?: boolean;
  defaultGdprClause?: string;
  defaultSlaText?: string;
  christmasMode?: boolean;
  numberFormat?: string;
  timeFormat?: string;
  weekStart?: string;
  roundingRule?: string;
  // Integrations
  cloudIntegrationGoogleDrive?: boolean;
  cloudIntegrationDropbox?: boolean;
  cloudIntegrationOneDrive?: boolean;
  googleCalendarIntegration?: boolean;
  notificationWebhookUrl?: string;
  // SMTP
  smtpHost?: string;
  smtpPort?: string | number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
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

  // Only check for isLegalHold change if it's being updated
  if (data.isLegalHold !== undefined) {
    // Ideally we should check for a higher permission or role here, but we'll stick to manage_settings for now
    // or assume the UI handles visibility.
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      taxId: data.taxId,
      vatId: data.vatId,
      vatPayerStatus: data.vatPayerStatus,
      defaultVatMode: data.defaultVatMode,
      address: data.address,
      web: data.web,
      email: data.email,
      phone: data.phone,
      isLegalHold: data.isLegalHold,
      defaultGdprClause: data.defaultGdprClause,
      defaultSlaText: data.defaultSlaText,
      christmasMode: data.christmasMode,
      numberFormat: data.numberFormat,
      timeFormat: data.timeFormat,
      weekStart: data.weekStart,
      roundingRule: data.roundingRule,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort ? parseInt(data.smtpPort.toString()) : undefined,
      smtpUser: data.smtpUser,
      smtpPassword: data.smtpPassword, // Should be encrypted in real app or handled securely
      smtpFrom: data.smtpFrom,
    },
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
  if (!user) throw new Error("Nejste přihlášeni.");

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

export async function deleteTestData(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId }
  });

  if (!membership || membership.role !== "SUPERADMIN" && membership.role !== "ADMIN") {
      throw new Error("Only Admin can delete test data");
  }

  // Check if organization is new (e.g. created within last 24h)
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Org not found");

  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  if (org.createdAt < oneDayAgo) {
      throw new Error("Cannot delete test data for organization older than 24 hours.");
  }

  // Delete data
  await prisma.$transaction([
      prisma.invoice.deleteMany({ where: { organizationId } }),
      prisma.expense.deleteMany({ where: { organizationId } }),
      prisma.bankMovement.deleteMany({ 
          where: { bankIntegration: { organizationId } } 
      }),
      prisma.client.deleteMany({ where: { organizationId } }),
      // Keep projects? Maybe. Let's delete them too if it's full clean.
      prisma.project.deleteMany({ where: { organizationId } }),
  ]);

  revalidatePath("/");
  return { success: true };
}
export async function removeBankDetail(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const bankDetail = await prisma.bankDetail.findUnique({ where: { id } });
  if (!bankDetail) throw new Error("Bank detail not found");

  const canManageSettings = await hasPermission(user.id, bankDetail.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankDetail.delete({ where: { id } });
  revalidatePath("/settings/organization");
}

export async function addBankIntegration(data: {
  provider: string;
  token: string;
  key?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageSettings = await hasPermission(user.id, orgId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  const encryptedToken = encryptString(data.token);
  const encryptedKey = data.key ? encryptString(data.key) : null;

  await prisma.bankIntegration.create({
    data: {
      organizationId: orgId,
      provider: data.provider,
      encryptedToken,
      encryptedKey,
      isActive: true,
    },
  });

  revalidatePath("/settings/organization");
}

export async function removeBankIntegration(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const integration = await prisma.bankIntegration.findUnique({ where: { id } });
  if (!integration) throw new Error("Integration not found");

  const canManageSettings = await hasPermission(user.id, integration.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankIntegration.delete({ where: { id } });
  revalidatePath("/settings/organization");
}

export async function toggleBankIntegration(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const integration = await prisma.bankIntegration.findUnique({ where: { id } });
  if (!integration) throw new Error("Integration not found");

  const canManageSettings = await hasPermission(user.id, integration.organizationId, "manage_settings");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat nastavení organizace.");
  }

  await prisma.bankIntegration.update({
    where: { id },
    data: { isActive: !integration.isActive },
  });
  revalidatePath("/settings/organization");
}

export async function syncBankNow(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const integration = await prisma.bankIntegration.findUnique({ where: { id } });
  if (!integration) throw new Error("Integration not found");

  const canManageSettings = await hasPermission(user.id, integration.organizationId, "manage_bank");
  if (!canManageSettings) {
    throw new Error("Nemáte oprávnění spravovat bankovní integrace.");
  }

  // 1. Sync
  await syncBankMovements(id);
  
  // 2. Match
  await matchPayments(integration.organizationId);

  revalidatePath("/settings/organization");
  return { success: true };
}

export async function addTaxRate(name: string, percentage: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) throw new Error("Membership not found");
  
  const canManageSettings = await hasPermission(user.id, membership.organizationId, "manage_settings");
  if (!canManageSettings) throw new Error("Unauthorized");

  // @ts-ignore - Prisma types might be out of sync
  await prisma.taxRate.create({
    data: {
      organizationId: membership.organizationId,
      name,
      percentage,
      isDefault: false,
      isActive: true
    }
  });

  revalidatePath("/settings/organization");
}
