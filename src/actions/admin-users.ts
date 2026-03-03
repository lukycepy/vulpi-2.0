
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function adminResetPassword(userId: string, organizationId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const canManageUsers = await hasPermission(currentUser.id, organizationId, "manage_users");
    if (!canManageUsers) {
        throw new Error("Nemáte oprávnění spravovat uživatele.");
    }

    // Generate random password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
    });

    // In a real app, we would send an email here using the organization's SMTP settings
    // For now, we'll return the password to display it to the admin (or simulate email sending)
    
    // Simulate email sending logic
    // await sendEmail({
    //    to: user.email,
    //    subject: "Reset hesla",
    //    body: `Vaše nové heslo je: ${password}`
    // });

    console.log(`[ADMIN RESET] New password for ${user.email}: ${password}`);

    revalidatePath("/settings/users");
    
    return { success: true, password }; // Returning password to show in UI for this MVP/Dev phase
}
