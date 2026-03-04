"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

// Helper for stats calculation
function calculateClientStats(client: any) {
  const invoices = client.invoices || [];
  
  // LTV (Lifetime Value) = sum of PAID invoices
  const totalTurnover = invoices
    .filter((inv: any) => inv.status === 'PAID')
    .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
    
  const unpaidInvoices = invoices.filter((inv: any) => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT');
  const unpaidCount = unpaidInvoices.length;
  const unpaidAmount = unpaidInvoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  
  // Payment morale
  const overdueCount = invoices.filter((inv: any) => inv.status === 'OVERDUE').length;
  const totalIssued = invoices.filter((inv: any) => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED').length;
  
  let paymentMorale = 100;
  if (totalIssued > 0) {
    paymentMorale = Math.max(0, 100 - ((overdueCount / totalIssued) * 100));
  }

  return {
    totalTurnover,
    unpaidCount,
    unpaidAmount,
    paymentMorale
  };
}

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
      tags: { select: { id: true, name: true, color: true } },
      contacts: { select: { id: true, name: true, email: true, phone: true } },
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

  return clients.map(client => ({
    ...client,
    stats: calculateClientStats(client)
  }));
}

export async function getClient(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      organization: { select: { isLegalHold: true } },
      tags: true,
      contacts: true,
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
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: client.organizationId }
  });
  
  if (!membership) throw new Error("Unauthorized");

  return {
    ...client,
    stats: calculateClientStats(client)
  };
}

import { z } from "zod";
import { logAction } from "@/actions/audit";

const ClientSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  taxId: z.string().optional(),
  vatId: z.string().optional(),
  address: z.string().optional(),
  mailingAddress: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingZip: z.string().optional(),
  mailingCountry: z.string().optional(),
  email: z.string().email("Neplatný email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  language: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  contacts: z.array(z.object({
    name: z.string().min(1, "Jméno kontaktu je povinné"),
    email: z.string().email("Neplatný email kontaktu").optional().or(z.literal("")),
    phone: z.string().optional(),
    position: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
});

export async function createClient(data: z.infer<typeof ClientSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const validation = ClientSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Neplatná data");
  }
  
  const validatedData = validation.data;

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
      name: validatedData.name,
      taxId: validatedData.taxId,
      vatId: validatedData.vatId,
      address: validatedData.address,
      mailingAddress: validatedData.mailingAddress,
      mailingCity: validatedData.mailingCity,
      mailingZip: validatedData.mailingZip,
      mailingCountry: validatedData.mailingCountry,
      email: validatedData.email,
      phone: validatedData.phone,
      notes: validatedData.notes,
      language: validatedData.language || "cs",
      tags: validatedData.tagIds ? {
        connect: validatedData.tagIds.map(id => ({ id }))
      } : undefined,
      contacts: validatedData.contacts ? {
        create: validatedData.contacts
      } : undefined
    },
  });
  
  await logAction("CREATE_CLIENT", client.id, null, validatedData);

  revalidatePath("/clients");
  return client;
}

export async function updateClient(id: string, data: Partial<z.infer<typeof ClientSchema>>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  // Partial validation for update
  const PartialClientSchema = ClientSchema.partial();
  const validation = PartialClientSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "Neplatná data");
  }
  
  const validatedData = validation.data;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  
  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.update({
    where: { id },
    data: {
      name: validatedData.name,
      taxId: validatedData.taxId,
      vatId: validatedData.vatId,
      address: validatedData.address,
      mailingAddress: validatedData.mailingAddress,
      mailingCity: validatedData.mailingCity,
      mailingZip: validatedData.mailingZip,
      mailingCountry: validatedData.mailingCountry,
      email: validatedData.email,
      phone: validatedData.phone,
      notes: validatedData.notes,
      language: validatedData.language,
      tags: validatedData.tagIds ? {
        set: validatedData.tagIds.map(tagId => ({ id: tagId }))
      } : undefined
    },
  });
  
  await logAction("UPDATE_CLIENT", id, client, validatedData);

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
  
  await logAction("DELETE_CLIENT", id, client, null);

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
    await prisma.contact.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false }
    });
  }
  
  await prisma.contact.create({
    data: {
      clientId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.position,
      isPrimary: !!data.isPrimary
    }
  });
  
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContactPerson(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { client: true }
  });

  if (!contact) throw new Error("Contact not found");

  const canManageClients = await hasPermission(user.id, contact.client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Unauthorized");

  await prisma.contact.delete({ where: { id } });
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
