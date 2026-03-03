"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { transporter } from "@/lib/email";
import { getInvoiceEmailTemplate } from "@/emails/templates";

export async function sendTestEmail(organizationId: string) {
  const user = await getCurrentUser();
  if (!user || !user.email) throw new Error("Nejste přihlášeni nebo nemáte e-mail.");
  
  const canManage = await hasPermission(user.id, organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) throw new Error("Organizace nenalezena.");

  const html = getInvoiceEmailTemplate(
    "Testovací Klient",
    "2023001",
    "10 000,00 Kč",
    "01.01.2023",
    "https://example.com/download",
    "https://example.com/track"
  );

  try {
    await transporter.sendMail({
      from: `"${organization.name}" <${process.env.SMTP_USER || 'vulpi@lcepelak.cz'}>`,
      to: user.email,
      subject: `Testovací e-mail z Vulpi - ${organization.name}`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send test email:", error);
    throw new Error("Nepodařilo se odeslat testovací e-mail.");
  }
}

export async function getInvoiceTemplates(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");
  
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

  return await (prisma as any).invoiceTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const template = await (prisma as any).invoiceTemplate.findUnique({
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

export async function createInvoiceTemplate(data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const canManage = await hasPermission(user.id, data.organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  return await (prisma as any).invoiceTemplate.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      fontFamily: data.fontFamily,
      logoPosition: data.logoPosition,
      showQrCode: data.showQrCode,
      showSignature: data.showSignature,
      customCss: data.customCss,
    },
  });
}

export async function updateInvoiceTemplate(id: string, data: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const template = await (prisma as any).invoiceTemplate.findUnique({
    where: { id },
  });

  if (!template) throw new Error("Šablona nenalezena.");

  const canManage = await hasPermission(user.id, template.organizationId, "manage_templates");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat šablony.");
  }

  const updatedTemplate = await (prisma as any).invoiceTemplate.update({
    where: { id },
    data: {
      name: data.name,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      fontFamily: data.fontFamily,
      logoPosition: data.logoPosition,
      showQrCode: data.showQrCode,
      showSignature: data.showSignature,
      customCss: data.customCss,
    },
  });

  revalidatePath("/settings/templates");
  return updatedTemplate;
}

export async function deleteInvoiceTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const template = await (prisma as any).invoiceTemplate.findUnique({
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

  await (prisma as any).invoiceTemplate.delete({
    where: { id },
  });
  
  revalidatePath("/settings/templates");
}

export async function setDefaultTemplate(organizationId: string, templateId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");
  
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
