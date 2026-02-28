"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-permissions";

export async function stopRunningTimer(userId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (userId !== user.id) {
    // Optionally allow admins to stop timers, but for now restrict to self
    throw new Error("Cannot stop other user's timer");
  }

  const running = await prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null
    }
  });

  if (running) {
    const now = new Date();
    const duration = Math.floor((now.getTime() - running.startTime.getTime()) / 1000);

    await prisma.timeEntry.update({
      where: { id: running.id },
      data: {
        endTime: now,
        duration
      }
    });
  }
}

export async function startTimeEntry(projectId: string | null, description: string) {
  const user = await getCurrentUser();
  
  // Get user's organization from membership
  // We assume the user is active in one organization context. 
  // Since we don't have an active organization context in the session yet (maybe), 
  // we pick the first organization they belong to, or rely on client sending orgId.
  // But `getCurrentUser` returns a user.
  
  // Let's find the organization from membership.
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) throw new Error("User is not a member of any organization");

  await stopRunningTimer(user.id);

  await prisma.timeEntry.create({
    data: {
      organizationId: membership.organizationId,
      userId: user.id,
      projectId: projectId || null,
      description,
      startTime: new Date(),
    }
  });

  revalidatePath("/time-tracking");
}

export async function stopTimer() {
  const user = await getCurrentUser();
  
  await stopRunningTimer(user.id);
  revalidatePath("/time-tracking");
}

export async function createManualTimeEntry(formData: FormData) {
  const user = await getCurrentUser();
  
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) throw new Error("User is not a member of any organization");

  const projectId = formData.get("projectId") as string;
  const description = formData.get("description") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  await prisma.timeEntry.create({
    data: {
      organizationId: membership.organizationId,
      userId: user.id,
      projectId: projectId || null,
      description,
      startTime,
      endTime,
      duration
    }
  });

  revalidatePath("/time-tracking");
}
