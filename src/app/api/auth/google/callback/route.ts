
import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { encryptString } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Google login failed", req.url));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.id || !userInfo.email) {
      return NextResponse.redirect(new URL("/login?error=Invalid Google User", req.url));
    }

    // Check if user is already logged in (linking account)
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    if (authToken) {
      // User is logged in, link account
      // Need to decrypt token to get user ID? 
      // Assuming we have a way to verify session or get user from token.
      // But `auth_token` is encrypted user ID.
      // Let's use `getCurrentUser` helper logic if possible, but here we are in API route.
      // We can try to decrypt.
      // Import decryptString from lib/crypto.
      // Or use `getCurrentUser` from `src/lib/auth-permissions.ts` if it works in API routes (it uses cookies()).

      // Let's rely on finding user by ID from cookie.
      // We can just query `prisma.user` where `id` matches decrypted token.
      
      // Wait, `getCurrentUser` might be async and use headers/cookies.
      // Let's try to reuse `getCurrentUser` logic or just decrypt.
      // The `login` action sets `auth_token` as encrypted user ID.
      
      // BUT `encryptString` and `decryptString` are available.
      // I need to import `decryptString`.
      
      // However, linking logic:
      // Find user by ID.
      // Create Account record.
      
      // Let's fetch user.
      const { decryptString } = await import("@/lib/crypto");
      let userId: string | null = null;
      try {
          userId = decryptString(authToken);
      } catch (e) {
          // invalid token
      }

      if (userId) {
          // Link account
          // Check if account already exists
          const existingAccount = await prisma.account.findUnique({
              where: {
                  provider_providerAccountId: {
                      provider: "google",
                      providerAccountId: userInfo.id
                  }
              }
          });

          if (existingAccount) {
              if (existingAccount.userId === userId) {
                  // Already linked to this user
                  return NextResponse.redirect(new URL("/settings/profile?success=Google account already linked", req.url));
              } else {
                  // Linked to another user
                  return NextResponse.redirect(new URL("/settings/profile?error=Google account linked to another user", req.url));
              }
          }

          // Create link
          await prisma.account.create({
              data: {
                  userId: userId,
                  type: "oauth",
                  provider: "google",
                  providerAccountId: userInfo.id,
                  access_token: tokens.access_token || undefined,
                  refresh_token: tokens.refresh_token || undefined,
                  expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
                  token_type: tokens.token_type || undefined,
                  scope: tokens.scope || undefined,
                  id_token: tokens.id_token || undefined,
              }
          });

          return NextResponse.redirect(new URL("/settings/profile?success=Google account linked", req.url));
      }
    }

    // User is NOT logged in (Login flow)
    // Find account by provider + providerAccountId
    const account = await prisma.account.findUnique({
        where: {
            provider_providerAccountId: {
                provider: "google",
                providerAccountId: userInfo.id
            }
        },
        include: { user: true }
    });

    if (account) {
        // Log in user
        const { encryptString } = await import("@/lib/crypto");
        const token = encryptString(account.user.id);
        
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return NextResponse.redirect(new URL("/", req.url));
    } else {
        // Account not found.
        // Option A: Auto-register (not requested, but common)
        // Option B: Error "Account not connected" (requested behavior: "connect in settings... then login")
        
        return NextResponse.redirect(new URL("/login?error=Google account not connected. Please login with password and connect in settings.", req.url));
    }

  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.redirect(new URL("/login?error=Google login failed", req.url));
  }
}
