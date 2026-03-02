"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function deleteUserAccount() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Memberships
      await tx.membership.deleteMany({ where: { userId: user.id } });

      // 2. TimeEntries
      await tx.timeEntry.deleteMany({ where: { userId: user.id } });

      // 3. ApprovalRequests (Requester)
      await tx.approvalRequest.deleteMany({ where: { requesterId: user.id } });
      
      // 4. ApprovalRequests (Approver - update to null)
      await tx.approvalRequest.updateMany({
        where: { approverId: user.id },
        data: { approverId: null }
      });

      // 5. ImpersonationLogs
      await tx.impersonationLog.deleteMany({ where: { impersonatorId: user.id } });
      await tx.impersonationLog.deleteMany({ where: { impersonatedId: user.id } });

      // 6. AuditLogs
      await tx.auditLog.deleteMany({ where: { userId: user.id } });

      // 7. Delete User
      await tx.user.delete({ where: { id: user.id } });
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw new Error("Chyba při mazání účtu.");
  }

  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("impersonated_user_id");
  cookieStore.delete("original_user_id");
  redirect("/login");
}

export async function exportClientData(clientId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášeni.");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      tags: true,
      contacts: true,
      invoices: {
        include: {
          items: true,
          disputes: true,
        }
      },
      disputes: true,
    }
  });

  if (!client) throw new Error("Klient nenalezen.");

  // Permission check
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: client.organizationId }
  });

  if (!membership) {
    throw new Error("Nemáte oprávnění k tomuto klientovi.");
  }

  // Fetch related logs
  // AuditLog has entityId. 
  const auditLogs = await prisma.auditLog.findMany({
    where: { 
      organizationId: client.organizationId,
      entityType: "CLIENT",
      entityId: clientId
    }
  });

  return {
    ...client,
    auditLogs
  };
}
