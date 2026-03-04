"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";

export async function logAction(
  action: string,
  entityId?: string,
  oldData?: any,
  newData?: any
) {
  try {
    const user = await getCurrentUser();
    if (!user) return; // Can't log if no user (or system action?)

    // Find organization context
    const membership = await prisma.membership.findFirst({
        where: { userId: user.id }
    });

    if (!membership) return;

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        organizationId: membership.organizationId,
        action,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : undefined,
        newData: newData ? JSON.stringify(newData) : undefined,
        // ipAddress and userAgent would need headers(), which are available in server actions
      }
    });
  } catch (e) {
    console.error("Failed to create audit log", e);
  }
}

export async function getAuditLogs(page = 1, limit = 50) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
        include: { organization: true }
    });

    if (!membership) throw new Error("No organization");

    // Check permissions - usually Admin/Superadmin
    const canViewLogs = ["ADMIN", "SUPERADMIN"].includes(membership.role);
    if (!canViewLogs) throw new Error("Forbidden");

    const logs = await prisma.auditLog.findMany({
        where: { organizationId: membership.organizationId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
    });

    return logs;
}