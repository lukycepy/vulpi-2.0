"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function getInvoiceTemplates(organizationId: string) {
  const user = await getCurrentUser();
  
  // Basic check: user must belong to the organization
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: organizationId,
    },
  });

  if (!membership) {
    throw new Error("Nemáte přístup k této organizaci.");
  }

  return await prisma.invoiceTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceTemplate(id: string) {
  const user = await getCurrentUser();

  const template = await prisma.invoiceTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return null;
  }

  // Basic check: user must belong to the organization of the template
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: template.organizationId,
    },
  });

  if (!membership) {
    throw new Error("Nemáte přístup k této šabloně.");
  }

  return template;
}

export async function createInvoiceTemplate(data: {
  organizationId: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoPosition?: string;
  showQrCode?: boolean;
  showSignature?: boolean;
  customCss?: string;
}) {
  const user = await getCurrentUser();
  
  const canManage = await hasPermission(user.id, data.organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  const template = await prisma.invoiceTemplate.create({
    data: {
      ...data,
      logoPosition: data.logoPosition || "left",
    },
  });
  
  revalidatePath("/settings/templates");
  return template;
}

export async function updateInvoiceTemplate(id: string, data: {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoPosition?: string;
  showQrCode?: boolean;
  showSignature?: boolean;
  customCss?: string;
}) {
  const user = await getCurrentUser();

  const template = await prisma.invoiceTemplate.findUnique({
    where: { id },
    select: { organizationId: true },
  });

  if (!template) {
    throw new Error("Šablona nenalezena.");
  }

  const canManage = await hasPermission(user.id, template.organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  const updatedTemplate = await prisma.invoiceTemplate.update({
    where: { id },
    data,
  });
  
  revalidatePath("/settings/templates");
  return updatedTemplate;
}

export async function deleteInvoiceTemplate(id: string) {
  const user = await getCurrentUser();

  const template = await prisma.invoiceTemplate.findUnique({
    where: { id },
    select: { organizationId: true },
  });

  if (!template) {
    throw new Error("Šablona nenalezena.");
  }

  const canManage = await hasPermission(user.id, template.organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  await prisma.invoiceTemplate.delete({
    where: { id },
  });
  
  revalidatePath("/settings/templates");
}

export async function setDefaultTemplate(organizationId: string, templateId: string) {
  const user = await getCurrentUser();
  
  const canManage = await hasPermission(user.id, organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  // This logic depends on how we want to store the default template.
  // For now, we might not have a "default" flag on the template model itself,
  // but we could add it or handle it via organization settings.
  // Since the user asked for "Visual Template Builder", we'll focus on creating/editing first.
  // If we need a default, we might need to add a field to Organization or InvoiceTemplate.
  // Let's assume the user selects a template when creating an invoice or we pick the first one.
  return;
}
