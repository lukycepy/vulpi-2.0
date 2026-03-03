
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { encryptString } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { syncBankMovements } from "@/services/bank/sync"; // Assuming this exists or will be exported

interface ImapIntegrationData {
  server: string;
  port: number;
  email: string;
  password: string;
  organizationId: string;
}

export async function saveImapIntegration(data: ImapIntegrationData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Nejste přihlášen");
    }

    // Verify permission
    const hasAccess = await hasPermission(user.id, data.organizationId, "manage_settings");
    if (!hasAccess) {
      throw new Error("Nemáte oprávnění spravovat integrace");
    }

    // Format: user@domain.com|imap.server.com|993
    const connectionString = `${data.email}|${data.server}|${data.port}`;
    
    const encryptedKey = encryptString(connectionString);
    const encryptedToken = encryptString(data.password);

    // Check if integration already exists
    const existing = await prisma.bankIntegration.findFirst({
      where: {
        organizationId: data.organizationId,
        provider: "IMAP",
        isActive: true
      }
    });

    if (existing) {
      // Update existing
      await prisma.bankIntegration.update({
        where: { id: existing.id },
        data: {
          encryptedKey,
          encryptedToken,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      await prisma.bankIntegration.create({
        data: {
          organizationId: data.organizationId,
          provider: "IMAP",
          encryptedKey,
          encryptedToken,
          isActive: true,
          lastSyncAt: new Date() // Initialize last sync
        }
      });
    }

    revalidatePath("/settings/integrations");
    return { success: true };
  } catch (error) {
    console.error("Save IMAP Integration Error:", error);
    return { error: error instanceof Error ? error.message : "Chyba při ukládání integrace" };
  }
}

export async function getBankMovements(organizationId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    
    const hasAccess = await hasPermission(user.id, organizationId, "view_invoices"); // or specific permission
    if (!hasAccess) throw new Error("Permission denied");

    return await prisma.bankMovement.findMany({
        where: {
            bankIntegration: { organizationId }
        },
        orderBy: { date: 'desc' },
        take: 100 // Limit for now
    });
}

export async function runBankMatching(organizationId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await hasPermission(user.id, organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Permission denied");

    // This calls the service we updated earlier
    await syncBankMovements(organizationId);
    revalidatePath("/banking");
}

export async function confirmMatch(movementId: string, invoiceId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const movement = await prisma.bankMovement.findUnique({ 
        where: { id: movementId },
        include: { bankIntegration: true }
    });
    if (!movement || !movement.bankIntegration) throw new Error("Movement not found");

    const hasAccess = await hasPermission(user.id, movement.bankIntegration.organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.$transaction([
        prisma.bankMovement.update({
            where: { id: movementId },
            data: { status: "MATCHED" }
        }),
        // Optionally update invoice status if fully paid?
        // We'll skip complex logic for now, just marking matched.
    ]);
    
    // In real app, we would create a Payment record linking invoice and movement.
    // Assuming we have Payment model or similar logic.
    // For now, let's just update the movement status as requested by UI.

    revalidatePath("/banking");
}

export async function ignoreMovement(movementId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const movement = await prisma.bankMovement.findUnique({ 
        where: { id: movementId },
        include: { bankIntegration: true }
    });
    if (!movement || !movement.bankIntegration) throw new Error("Movement not found");

    const hasAccess = await hasPermission(user.id, movement.bankIntegration.organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.bankMovement.update({
        where: { id: movementId },
        data: { status: "IGNORED" }
    });
    revalidatePath("/banking");
}

export async function unmatchMovement(movementId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const movement = await prisma.bankMovement.findUnique({ 
        where: { id: movementId },
        include: { bankIntegration: true }
    });
    if (!movement || !movement.bankIntegration) throw new Error("Movement not found");

    const hasAccess = await hasPermission(user.id, movement.bankIntegration.organizationId, "manage_invoices");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.bankMovement.update({
        where: { id: movementId },
        data: { status: "UNMATCHED" }
    });
    revalidatePath("/banking");
}
