
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";

export async function requestEmergencyAccess(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  // Check if there is an existing pending request
  // @ts-ignore - Prisma types might be out of sync
  const existing = await prisma.emergencyAccess.findUnique({
    where: {
        organizationId_userId: {
            organizationId,
            userId: user.id
        }
    }
  });

  if (existing) {
      if (existing.isPending) {
          throw new Error("Žádost již existuje a čeká na schválení (nebo vypršení lhůty)");
      }
      if (existing.grantedAt) {
          throw new Error("Přístup byl již udělen");
      }
  }

  // Create request
  // @ts-ignore - Prisma types might be out of sync
  await prisma.emergencyAccess.create({
    data: {
      organizationId,
      userId: user.id,
      targetRole: "ADMIN",
      isPending: true,
      requestedAt: new Date()
    }
  });

  // Notify admins? (Email)
  // ...

  revalidatePath("/settings/security");
  return { success: true };
}

export async function setEmergencyContact(userId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Nejste přihlášen");

    const membership = await prisma.membership.findFirst({
        where: { userId: currentUser.id }
    });

    if (!membership) throw new Error("Nejste členem organizace");

    const hasAccess = await hasPermission(currentUser.id, membership.organizationId, "manage_settings");
    if (!hasAccess) throw new Error("Nemáte oprávnění");

    // In a real app, we would store this "Emergency Contact" relation explicitly.
    // For now, let's assume we just create a pre-approved EmergencyAccess record 
    // that is NOT pending but also NOT granted yet (waiting for activation).
    // But our schema has isPending default false. 
    // Let's adjust logic: "Emergency Contact" is just someone who CAN request access.
    // So maybe we don't need to do anything here if the logic is "Anyone can request, but only designated contact gets it automatically after 30 days".
    // Or we store "isEmergencyContact" on Membership?
    
    // Simpler approach for this task: Just create/update EmergencyAccess record to indicate this user is the designated contact.
    // We'll use isPending=false, grantedAt=null as "Designated".
    
    // @ts-ignore - Prisma types might be out of sync
    await prisma.emergencyAccess.upsert({
        where: {
            organizationId_userId: {
                organizationId: membership.organizationId,
                userId: userId
            }
        },
        update: {
            targetRole: "ADMIN",
            isPending: false, // Not a request yet, just designation
            requestedAt: null,
            grantedAt: null
        },
        create: {
            organizationId: membership.organizationId,
            userId: userId,
            targetRole: "ADMIN",
            isPending: false,
            requestedAt: null,
            grantedAt: null
        }
    });

    revalidatePath("/settings/security");
    return { success: true };
}
