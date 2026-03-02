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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Zadejte email a heslo" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true }
    });

    if (!user) {
      return { error: "Neplatný email nebo heslo" };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: "Neplatný email nebo heslo" };
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
  const isAlreadyImpersonating = cookieStore.has("impersonated_user_id");
  if (isAlreadyImpersonating) {
    throw new Error("Already impersonating. Stop current session first.");
  }

  const canImpersonate = await hasPermission(currentUser.id, orgId, "impersonate_users");
  if (!canImpersonate) {
    throw new Error("Nemáte oprávnění k impersonaci uživatelů.");
  }

  // Set cookies
  // Store original user ID to verify later (optional, but good for audit)
  cookieStore.set("original_user_id", currentUser.id, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  cookieStore.set("impersonated_user_id", targetUserId, { httpOnly: true, secure: process.env.NODE_ENV === "production" });

  revalidatePath("/");
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
