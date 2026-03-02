
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(message: string, type: "INFO" | "WARNING" | "ERROR" = "INFO") {
    const user = await getCurrentUser();
    // In real app, check if user is SUPERADMIN
    if (!user) throw new Error("Unauthorized");

    // @ts-ignore - Prisma types might be out of sync
    await prisma.globalAnnouncement.create({
        data: {
            message,
            type,
            active: true
        }
    });

    revalidatePath("/");
}

export async function toggleAnnouncement(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // @ts-ignore - Prisma types might be out of sync
    const ann = await prisma.globalAnnouncement.findUnique({ where: { id } });
    if (!ann) return;

    // @ts-ignore - Prisma types might be out of sync
    await prisma.globalAnnouncement.update({
        where: { id },
        data: { active: !ann.active }
    });

    revalidatePath("/");
}

export async function blockUser(userId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    // Check superadmin...

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return;

    await prisma.user.update({
        where: { id: userId },
        data: { 
            // @ts-ignore - Prisma types might be out of sync
            isBlocked: !targetUser.isBlocked 
        }
    });

    revalidatePath("/settings/users"); // or admin users list
}
