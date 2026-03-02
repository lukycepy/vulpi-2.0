"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function getContracts(clientId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");

  const contracts = await prisma.contract.findMany({
    where: { 
      organizationId: membership.organizationId,
      clientId 
    },
    orderBy: { createdAt: 'desc' }
  });

  return contracts;
}

export async function getExpiringContracts(days: number = 30) {
  const user = await getCurrentUser();
  if (!user) return [];

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) return [];

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  const contracts = await prisma.contract.findMany({
    where: {
      organizationId: membership.organizationId,
      validUntil: {
        gte: today,
        lte: futureDate
      }
    },
    include: {
      client: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      validUntil: 'asc'
    }
  });

  return contracts;
}

export async function createContract(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Nejste členem žádné organizace");

  const clientId = formData.get("clientId") as string;
  const title = formData.get("title") as string;
  const validFromStr = formData.get("validFrom") as string;
  const validUntilStr = formData.get("validUntil") as string;
  const file = formData.get("file") as File;

  if (!clientId || !title || !file) {
    throw new Error("Chybí povinné údaje");
  }

  const validFrom = validFromStr ? new Date(validFromStr) : null;
  const validUntil = validUntilStr ? new Date(validUntilStr) : null;

  let fileUrl = null;

  if (file && file.size > 0) {
    const uploadDir = join(process.cwd(), "public", "uploads", "contracts");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.name.split('.').pop() || 'pdf';
    const filename = `contract-${uniqueSuffix}.${extension}`;
    const filepath = join(uploadDir, filename);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    fileUrl = `/uploads/contracts/${filename}`;
  }

  await prisma.contract.create({
    data: {
      organizationId: membership.organizationId,
      clientId,
      title,
      validFrom,
      validUntil,
      fileUrl
    }
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteContract(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { organization: true }
  });

  if (!contract) throw new Error("Smlouva nenalezena");

  if (contract.organization.isLegalHold) {
    throw new Error("Nelze smazat - aktivní Legal Hold");
  }

  // Check permissions (assuming contracts are managed by client managers or admins)
  const hasAccess = await hasPermission(user.id, contract.organizationId, "manage_clients");
  if (!hasAccess) throw new Error("Nemáte oprávnění.");

  if (contract.fileUrl) {
    try {
      const filepath = join(process.cwd(), "public", contract.fileUrl);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    } catch (e) {
      console.error("Failed to delete contract file", e);
    }
  }

  await prisma.contract.delete({ where: { id } });
  revalidatePath(`/clients/${contract.clientId}`);
}
