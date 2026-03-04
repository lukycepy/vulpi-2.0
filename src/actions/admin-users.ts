
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, isSuperAdmin } from "@/lib/auth-permissions";
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

export async function adminUpdateUserProfile(userId: string, organizationId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    timezone?: string;
    password?: string;
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // Check permissions
    // 1. Check if user has manage_users in the specific organization
    const canManageUsers = await hasPermission(currentUser.id, organizationId, "manage_users");
    
    // 2. Check if user is Global SuperAdmin (has SUPERADMIN role in any org - heuristic)
    const isGlobalSuperAdmin = await isSuperAdmin(currentUser.id);

    if (!canManageUsers && !isGlobalSuperAdmin) {
        throw new Error("Nemáte oprávnění spravovat uživatele.");
    }

    // If modifying a user who is NOT in the current organization, you must be Global SuperAdmin
    // (This prevents a local admin from editing a user ID they just guessed, unless they are in the same org)
    // Verify target user membership in organizationId
    const targetMembership = await prisma.membership.findFirst({
        where: { userId, organizationId }
    });

    if (!targetMembership && !isGlobalSuperAdmin) {
         throw new Error("Tento uživatel není členem vaší organizace.");
    }

    try {
        const updateData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            username: data.username || null,
            timezone: data.timezone
        };

        if (data.password && data.password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            updateData.passwordHash = hashedPassword;
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        
        revalidatePath("/settings/users");
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') {
            throw new Error("Email nebo uživatelské jméno je již obsazeno.");
        }
        throw e;
    }
}
