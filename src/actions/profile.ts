
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateAvatar(avatarUrl: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl }
  });

  revalidatePath("/", "layout");
}

export async function updateDashboardPreferences(preferences: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
  
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        // @ts-ignore - Prisma types might be out of sync
        dashboardPreferences: JSON.stringify(preferences) 
      }
    });
  
    revalidatePath("/dashboard");
}

export async function updateTimezone(timezone: string) {
  const user = await getCurrentUser();
  if (!user) return;

  // @ts-ignore - Prisma types might be out of sync
  if (user.timezone !== timezone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        // @ts-ignore - Prisma types might be out of sync
        timezone 
      }
    });
    
    const cookieStore = await cookies();
    cookieStore.set("app_timezone", timezone, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    
    revalidatePath("/", "layout");
  }
}
