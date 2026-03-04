
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { OTP } from "otplib";
import { logAction } from "@/actions/audit";

export async function generateTwoFactorSecret(userId: string) {
    const user = await getCurrentUser();
    if (!user || user.id !== userId) throw new Error("Unauthorized");

    const otp = new OTP({ strategy: "totp" });
    const secret = otp.generateSecret();
    
    // We don't save it yet, we just return it to be scanned.
    // Or we save it as "pending" or just rely on client sending it back for verification.
    // Usually we save it to DB temporarily or just return it and save only when verified.
    // Let's return the secret and otpauth url.
    
    const otpauth = otp.generateURI({ issuer: "Vulpi", label: user.email, secret });

    return { secret, otpauth };
}

export async function enableTwoFactor(userId: string, token: string, secret: string) {
    const user = await getCurrentUser();
    if (!user || user.id !== userId) throw new Error("Unauthorized");

    const otp = new OTP({ strategy: "totp" });
    const result = otp.verifySync({ token, secret });
    if (!result.valid) throw new Error("Invalid token");

    // Save secret to user
    // Note: You should encrypt this secret in DB!
    // I'll assume `twoFactorSecret` field exists on User.
    // If not, this will error.
    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorEnabled: true,
            twoFactorSecret: secret // Should be encrypted in real app
        }
    });

    return { success: true };
}

export async function disableTwoFactor(userId: string) {
    const user = await getCurrentUser();
    if (!user || user.id !== userId) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null
        }
    });

    return { success: true };
}

export async function setEmergencyContact(emergencyUserId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id },
        select: { organizationId: true, role: true }
    });

    if (!membership) throw new Error("No organization");
    if (!["ADMIN", "SUPERADMIN"].includes(membership.role)) {
        throw new Error("Nemáte oprávnění měnit nouzový kontakt.");
    }

    const contactMembership = await prisma.membership.findFirst({
        where: { userId: emergencyUserId, organizationId: membership.organizationId },
        select: { id: true }
    });

    if (!contactMembership) {
        throw new Error("Vybraný uživatel není členem organizace.");
    }

    await prisma.emergencyAccess.deleteMany({
        where: {
            organizationId: membership.organizationId,
            NOT: { userId: emergencyUserId }
        }
    });

    const record = await prisma.emergencyAccess.upsert({
        where: { organizationId_userId: { organizationId: membership.organizationId, userId: emergencyUserId } },
        create: {
            organizationId: membership.organizationId,
            userId: emergencyUserId,
            targetRole: "ADMIN",
            isPending: false,
            requestedAt: null,
            grantedAt: null
        },
        update: {
            targetRole: "ADMIN",
            isPending: false,
            requestedAt: null,
            grantedAt: null
        }
    });

    await logAction("SET_EMERGENCY_CONTACT", record.id, null, { emergencyUserId });

    return { success: true };
}

export async function requestEmergencyAccess(organizationId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, organizationId },
        select: { id: true }
    });

    if (!membership) throw new Error("Unauthorized");

    const emergency = await prisma.emergencyAccess.findUnique({
        where: { organizationId_userId: { organizationId, userId: user.id } }
    });

    if (!emergency) {
        throw new Error("Nemáte nastavený nouzový přístup pro tuto organizaci.");
    }

    const updated = await prisma.emergencyAccess.update({
        where: { id: emergency.id },
        data: {
            isPending: true,
            requestedAt: new Date(),
            targetRole: "ADMIN"
        }
    });

    await logAction("REQUEST_EMERGENCY_ACCESS", updated.id, emergency, { organizationId });

    return { success: true };
}
