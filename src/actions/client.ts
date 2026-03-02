"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function getClients() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    include: {
      organization: { select: { isLegalHold: true } },
      // tags: true, // Tags removed for now as schema mismatch
      // contacts: true, // Contacts removed for now
      invoices: {
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate stats
  return clients.map(client => {
    // LTV (Lifetime Value) = sum of PAID invoices
    const totalTurnover = client.invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
      
    const unpaidInvoices = client.invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT');
    const unpaidCount = unpaidInvoices.length;
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Payment morale: Calculate percentage of invoices paid on time vs late
    // We need dueAt and payment date. We don't have payment date in Invoice model easily available (maybe in AuditLog or BankMovement).
    // For now, let's use a simple heuristic: Ratio of OVERDUE invoices to Total Issued.
    const overdueCount = client.invoices.filter(inv => inv.status === 'OVERDUE').length;
    const totalIssued = client.invoices.filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED').length;
    
    let paymentMorale = 100;
    if (totalIssued > 0) {
      paymentMorale = Math.max(0, 100 - ((overdueCount / totalIssued) * 100));
    }

    return {
      ...client,
      stats: {
        totalTurnover,
        unpaidCount,
        unpaidAmount,
        paymentMorale
      }
    };
  });
}

export async function getClient(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      organization: { select: { isLegalHold: true } },
      // tags: true,
      // contacts: true,
      invoices: {
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true,
        }
      }
    }
  });

  if (!client) return null;
  
  // Permission check
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: client.organizationId }
  });
  
  if (!membership) throw new Error("Unauthorized");

  // Calculate stats
  const totalTurnover = client.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const unpaidInvoices = client.invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT');
  const unpaidCount = unpaidInvoices.length;
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  const overdueCount = client.invoices.filter(inv => inv.status === 'OVERDUE').length;
  const totalIssued = client.invoices.filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED').length;
  
  let paymentMorale = 100;
  if (totalIssued > 0) {
    paymentMorale = Math.max(0, 100 - ((overdueCount / totalIssued) * 100));
  }

  return {
    ...client,
    stats: {
      totalTurnover,
      unpaidCount,
      unpaidAmount,
      paymentMorale
    }
  };
}

export async function createClient(data: {
  name: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingZip?: string;
  mailingCountry?: string;
  email?: string;
  phone?: string;
  notes?: string;
  language?: string;
  tagIds?: string[];
  contacts?: {
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    isPrimary?: boolean;
  }[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageClients = await hasPermission(user.id, orgId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  const client = await prisma.client.create({
    data: {
      organizationId: orgId,
      name: data.name,
      taxId: data.taxId,
      vatId: data.vatId,
      address: data.address,
      mailingAddress: data.mailingAddress,
      mailingCity: data.mailingCity,
      mailingZip: data.mailingZip,
      mailingCountry: data.mailingCountry,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      language: data.language || "cs",
      tags: data.tagIds ? {
        connect: data.tagIds.map(id => ({ id }))
      } : undefined,
      contacts: data.contacts ? {
        create: data.contacts
      } : undefined
    },
  });
  
  revalidatePath("/clients");
  return client;
}

export async function updateClient(id: string, data: {
  name?: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingZip?: string;
  mailingCountry?: string;
  email?: string;
  phone?: string;
  notes?: string;
  language?: string;
  tagIds?: string[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  
  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      taxId: data.taxId,
      vatId: data.vatId,
      address: data.address,
      mailingAddress: data.mailingAddress,
      mailingCity: data.mailingCity,
      mailingZip: data.mailingZip,
      mailingCountry: data.mailingCountry,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      language: data.language,
      tags: data.tagIds ? {
        set: data.tagIds.map(tagId => ({ id: tagId }))
      } : undefined
    },
  });
  
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const client = await prisma.client.findUnique({ 
    where: { id },
    include: { organization: true }
  });
  if (!client) throw new Error("Client not found");

  if (client.organization.isLegalHold) {
    throw new Error("Nelze smazat - aktivní Legal Hold");
  }
  
  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.delete({
    where: { id },
  });
  
  revalidatePath("/clients");
}

// --- Tags ---

export async function getClientTags() {
  const user = await getCurrentUser();
  if (!user) return [];

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) return [];
  const orgId = membership.organizationId;

  return prisma.clientTag.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' }
  });
}

export async function createClientTag(name: string, color: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  if (!membership) throw new Error("No organization");

  return prisma.clientTag.create({
    data: {
      organizationId: membership.organizationId,
      name,
      color
    }
  });
}

export async function deleteClientTag(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const tag = await prisma.clientTag.findUnique({ where: { id } });
  if (!tag) throw new Error("Tag not found");

  const canManage = await hasPermission(user.id, tag.organizationId, "manage_clients");
  if (!canManage) throw new Error("Unauthorized");

  await prisma.clientTag.delete({ where: { id } });
  revalidatePath("/clients");
}

// --- Contacts ---

export async function addContactPerson(clientId: string, data: {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Basic permission check could be here
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { organizationId: true }
  });

  if (!client) throw new Error("Client not found");

  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  if (data.isPrimary) {
    // Unset other primary contacts
    await prisma.contactPerson.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false }
    });
  }

  await prisma.contactPerson.create({
    data: {
      clientId,
      ...data
    }
  });
  
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContactPerson(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const contact = await prisma.contactPerson.findUnique({
    where: { id },
    include: { client: true }
  });

  if (!contact) throw new Error("Contact not found");

  const canManageClients = await hasPermission(user.id, contact.client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Unauthorized");

  await prisma.contactPerson.delete({ where: { id } });
  revalidatePath(`/clients/${contact.clientId}`);
}

// --- VIES Validation ---

export async function validateVatNumber(vatId: string) {
  // Format: CZ12345678
  const countryCode = vatId.substring(0, 2).toUpperCase();
  const vatNumber = vatId.substring(2);

  if (!/^[A-Z]{2}/.test(countryCode)) {
      return { valid: false, message: "Neplatný formát kódu země" };
  }

  try {
    const response = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            countryCode,
            vatNumber
        })
    });

    const data = await response.json();
    
    if (data.isValid) {
        return {
            valid: true,
            name: data.name,
            address: data.address,
            message: "Platné DIČ (VIES)"
        };
    } else {
        return { valid: false, message: "DIČ nebylo v systému VIES nalezeno nebo je neplatné." };
    }
  } catch (error) {
      console.error("VIES Error:", error);
      return { valid: false, message: "Chyba při komunikaci se systémem VIES." };
  }
}
