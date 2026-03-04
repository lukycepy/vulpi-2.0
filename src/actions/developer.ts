"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";
import { randomBytes, createHash } from "crypto";

// --- Webhooks ---

export async function getWebhooks() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("Membership not found");

  const webhooks = await prisma.webhook.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { logs: true }
      }
    }
  });

  return webhooks;
}

export async function createWebhook(data: { targetUrl: string; eventTypes: string[] }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("Membership not found");

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_settings");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat nastavení.");

  const secretKey = randomBytes(32).toString("hex");

  await prisma.webhook.create({
    data: {
      organizationId: membership.organizationId,
      targetUrl: data.targetUrl,
      eventTypes: data.eventTypes.join(","),
      secretKey,
      isActive: true,
    },
  });

  revalidatePath("/settings/developers/webhooks");
}

export async function deleteWebhook(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const webhook = await prisma.webhook.findUnique({
    where: { id },
    include: { organization: true }
  });

  if (!webhook) throw new Error("Webhook nenalezen");

  const hasAccess = await hasPermission(user.id, webhook.organizationId, "manage_settings");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat nastavení.");

  await prisma.webhook.delete({ where: { id } });
  revalidatePath("/settings/developers/webhooks");
}

export async function toggleWebhook(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const webhook = await prisma.webhook.findUnique({
    where: { id },
    include: { organization: true }
  });

  if (!webhook) throw new Error("Webhook nenalezen");

  const hasAccess = await hasPermission(user.id, webhook.organizationId, "manage_settings");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat nastavení.");

  await prisma.webhook.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath("/settings/developers/webhooks");
}

export async function getWebhookLogs(webhookId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nejste přihlášeni.");

    const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
        include: { organization: true }
    });

    if (!webhook) throw new Error("Webhook nenalezen");
    
    // Check permission (implicit via organization check)
    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, organizationId: webhook.organizationId }
    });
    if (!membership) throw new Error("Nemáte přístup k této organizaci");

    return prisma.webhookLog.findMany({
        where: { webhookId },
        orderBy: { createdAt: "desc" },
        take: 50
    });
}


// --- API Keys ---

export async function getApiKeys() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) throw new Error("Membership not found");

  const keys = await prisma.apiKey.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        // Do not return keyHash!
    }
  });

  return keys;
}

export async function createApiKey(name: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nejste přihlášeni.");
  
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
    });
  
    if (!membership) throw new Error("Membership not found");
  
    const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_settings");
    if (!hasAccess) throw new Error("Nemáte oprávnění spravovat nastavení.");

    // Generate Key
    const rawKey = "sk_vulpi_" + randomBytes(24).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12) + "...";

    await prisma.apiKey.create({
        data: {
            organizationId: membership.organizationId,
            name,
            keyPrefix,
            keyHash
        }
    });

    revalidatePath("/settings/developers/api-keys");
    return rawKey; // Return only once!
}

export async function deleteApiKey(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nejste přihlášeni.");
  
    const key = await prisma.apiKey.findUnique({
      where: { id },
      include: { organization: true }
    });
  
    if (!key) throw new Error("Klíč nenalezen");
  
    const hasAccess = await hasPermission(user.id, key.organizationId, "manage_settings");
    if (!hasAccess) throw new Error("Nemáte oprávnění spravovat nastavení.");
  
    await prisma.apiKey.delete({ where: { id } });
    revalidatePath("/settings/developers/api-keys");
  }
