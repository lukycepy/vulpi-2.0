"use server";

import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { encryptString, decryptString } from "@/lib/crypto";
import { verify } from "otplib";

export async function login(formData: FormData) {
  const login = formData.get("email") as string; // Changed from 'email' to 'login' to reflect dual nature
  const password = formData.get("password") as string;

  if (!login || !password) {
    return { error: "Zadejte email/uživatelské jméno a heslo" };
  }

  try {
    // Check if input is email or username
    const isEmail = login.includes("@");
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login },
          { username: login }
        ]
      },
      include: { memberships: true }
    });

    if (!user) {
      return { error: "Neplatné přihlašovací údaje" };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: "Neplatné přihlašovací údaje" };
    }

    // Geolocation Logic
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";
        
        let locationData = { city: "Unknown", country: "Unknown" };
        
        if (ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
            try {
                const response = await fetch(`https://ipapi.co/${ip}/json/`);
                if (response.ok) {
                    const geo = await response.json();
                    locationData = {
                        city: geo.city || "Unknown",
                        country: geo.country_name || "Unknown"
                    };
                }
            } catch (geoError) {
                console.error("GeoIP fetch failed:", geoError);
            }
        }

        // Log login if user belongs to an organization
        const primaryOrgId = user.memberships[0]?.organizationId;
        if (primaryOrgId) {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    organizationId: primaryOrgId,
                    action: "USER_LOGIN",
                    ipAddress: ip,
                    userAgent: userAgent,
                    newData: JSON.stringify({ ip, ...locationData })
                }
            });
        }
    } catch (logError) {
        console.error("Failed to log login:", logError);
    }

    if (user.twoFactorEnabled) {
      return { 
        requires2FA: true, 
        userId: encryptString(user.id) 
      };
    }

    const cookieStore = await cookies();
    
    // Create a simple session cookie with encrypted user ID
    const token = encryptString(user.id);
    
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Chyba při přihlášení" };
  }
  
  return { success: true };
}

export async function switchOrganization(organizationId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Verify membership
    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, organizationId }
    });

    if (!membership) throw new Error("Not a member of this organization");

    const cookieStore = await cookies();
    cookieStore.set("active_org_id", organizationId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
    });

    revalidatePath("/", "layout");
}

export async function verifyTwoFactorLogin(encryptedUserId: string, token: string) {
  try {
    const userId = decryptString(encryptedUserId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return { error: "Neplatný požadavek" };
    }

    const isValid = verify({ token, secret: user.twoFactorSecret });
    if (!isValid) {
      return { error: "Neplatný kód" };
    }

    const cookieStore = await cookies();
    const authToken = encryptString(user.id);
    cookieStore.set("auth_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    return { success: true };

  } catch (e) {
    console.error("2FA Verification Error", e);
    return { error: "Chyba ověření" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("impersonated_user_id");
  cookieStore.delete("original_user_id");
  redirect("/login");
}


export async function logoutWithReason(reason: string) {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("impersonated_user_id");
  cookieStore.delete("original_user_id");
  return { success: true };
}

export async function impersonateUser(targetUserId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Not authenticated");

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

  const cookieStore = await cookies();
  cookieStore.set("impersonated_user_id", targetUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  
  cookieStore.set("original_user_id", currentUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  revalidatePath("/", "layout");
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user not found to prevent enumeration
      return { success: true };
    }

    // Generate random password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
    });

    // In a real app, send email here
    console.log(`[PASSWORD RESET] New password for ${email}: ${password}`);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Chyba při resetování hesla" };
  }
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  
  if (!cookieStore.has("impersonated_user_id")) {
    return;
  }

  cookieStore.delete("impersonated_user_id");
  cookieStore.delete("original_user_id");
  
  revalidatePath("/");
}
