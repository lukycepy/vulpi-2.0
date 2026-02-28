"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function impersonateUser(targetUserId: string) {
  const currentUser = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: currentUser.id },
  });

  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  // Verify target user is in the same organization
  const targetMembership = await prisma.membership.findFirst({
    where: { userId: targetUserId, organizationId: orgId },
  });

  if (!targetMembership) {
    throw new Error("Target user is not in your organization.");
  }
  
  const isAlreadyImpersonating = cookies().has("impersonated_user_id");
  if (isAlreadyImpersonating) {
    throw new Error("Already impersonating. Stop current session first.");
  }

  const canImpersonate = await hasPermission(currentUser.id, orgId, "impersonate_users");
  if (!canImpersonate) {
    throw new Error("Nemáte oprávnění k impersonaci uživatelů.");
  }

  // Set cookies
  // Store original user ID to verify later (optional, but good for audit)
  cookies().set("original_user_id", currentUser.id, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  cookies().set("impersonated_user_id", targetUserId, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

  revalidatePath("/");
}

export async function stopImpersonation() {
  cookies().delete("impersonated_user_id");
  cookies().delete("original_user_id");
  revalidatePath("/");
}
