import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/ui/BottomNav";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { ChatbotWidget } from "@/components/fox/ChatbotWidget";
import { AutoLogout } from "@/components/AutoLogout";
import { SnowEffect } from "@/components/ui/SnowEffect";
import { TimezoneDetector } from "@/components/utils/TimezoneDetector";
import { AnnouncementBanner } from "@/components/ui/AnnouncementBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vulpi Invoicing",
  description: "Modern SaaS invoicing system",
  manifest: "/manifest.json",
  themeColor: "#ea580c",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  let showChatbot = false;
  let showSnow = false;

  const today = new Date();
  const isChristmasTime = today.getMonth() === 11 && today.getDate() >= 20 && today.getDate() <= 26;

  if (user) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { organization: true }
    });
    
    if (membership) {
       // Check chatbot permission
       // Ideally fetch permissions properly, but keeping existing logic for chatbot
       if (["ADMIN", "SUPERADMIN"].includes(membership.role)) {
          showChatbot = true;
       }

       // Check snow
       if (membership.organization.christmasMode || isChristmasTime) {
          showSnow = true;
       }
    }
  } else if (isChristmasTime) {
     // Even logged out users see snow during Christmas?
     // The prompt says "Do Organization settings přidej toggle christmasMode. Pokud je aktivní...".
     // But implies "automaticky zapnutý od 20. do 26. prosince".
     // Let's enable for everyone during Christmas time as a nice touch.
     showSnow = true;
  }

  return (
    <html lang="cs">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased pb-16 md:pb-0",
          inter.className
        )}
      >
        <TimezoneDetector />
        <ImpersonationBanner />
        <AnnouncementBanner />
        {user && <AutoLogout />}
        {showSnow && <SnowEffect />}
        {children}
        <BottomNav />
        {showChatbot && <ChatbotWidget />}
        <Toaster />
      </body>
    </html>
  );
}
