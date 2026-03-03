
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

export async function updateProfile(data: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Basic validation
    if (!data.email || !data.firstName || !data.lastName) {
        throw new Error("Missing required fields");
    }

    const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username || null, // Allow clearing username
        timezone: data.timezone,
        avatarUrl: data.avatarUrl
    };

    if (data.password) {
        if (data.password.length < 6) {
            throw new Error("Heslo musí mít alespoň 6 znaků");
        }
        const bcrypt = await import("bcryptjs");
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });
    } catch (e: any) {
        // Handle unique constraint violation for username/email
        if (e.code === 'P2002') {
            throw new Error("Email nebo uživatelské jméno je již obsazeno.");
        }
        throw e;
    }

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
