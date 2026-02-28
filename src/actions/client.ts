"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function createClient(data: {
  name: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  email?: string;
  phone?: string;
  defaultDueDays?: number;
  defaultCurrency?: string;
}) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageClients = await hasPermission(user.id, orgId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.create({
    data: {
      ...data,
      organizationId: orgId,
      defaultDueDays: data.defaultDueDays || 14,
    },
  });
  
  revalidatePath("/clients");
}

export async function updateClient(id: string, data: {
  name: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  email?: string;
  phone?: string;
  defaultDueDays?: number;
  defaultCurrency?: string;
}) {
  const user = await getCurrentUser();
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  
  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.update({
    where: { id },
    data,
  });
  
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  const user = await getCurrentUser();
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) throw new Error("Client not found");
  
  const canManageClients = await hasPermission(user.id, client.organizationId, "manage_clients");
  if (!canManageClients) throw new Error("Nemáte oprávnění spravovat klienty.");

  await prisma.client.delete({
    where: { id },
  });
  
  revalidatePath("/clients");
}
