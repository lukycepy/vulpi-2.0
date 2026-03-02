
"use client";

import { clientLogout } from "@/actions/portal";
import { LogOut, Building, User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface PortalHeaderProps {
  clientName: string;
  clientLogo?: string | null;
  organization: {
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  };
}

export default function PortalHeader({ clientName, clientLogo, organization }: PortalHeaderProps) {
  // Apply branding colors
  useEffect(() => {
    if (organization.primaryColor) {
      document.documentElement.style.setProperty('--primary', organization.primaryColor);
    }
    if (organization.secondaryColor) {
      document.documentElement.style.setProperty('--secondary', organization.secondaryColor);
    }
    
    // Cleanup on unmount not strictly necessary for portal as it's a full page context, 
    // but good practice if we switched contexts.
    return () => {
        // We might want to reset, but since this is the portal layout, 
        // it's fine to keep them until reload or navigation away.
    };
  }, [organization.primaryColor, organization.secondaryColor]);

  return (
    <header className="border-b bg-white dark:bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        {/* Organization Logo (Supplier) */}
        <Link href="/portal" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          {organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logoUrl} alt={organization.name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
               <div className="bg-primary/10 p-2 rounded-md">
                 <Building className="h-5 w-5 text-primary" />
               </div>
               <span className="text-xl font-bold text-gray-900 dark:text-white">
                 {organization.name}
               </span>
            </div>
          )}
        </Link>
        
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>
        
        <span className="text-sm font-medium text-muted-foreground hidden md:block">
            Klientská zóna
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Client Info */}
        <div className="flex items-center gap-3">
            {clientLogo ? (
                 // eslint-disable-next-line @next/next/no-img-element
                <img src={clientLogo} alt={clientName} className="h-8 w-8 rounded-full object-cover border" />
            ) : (
                <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-secondary-foreground" />
                </div>
            )}
            <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Přihlášen</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white leading-none">{clientName}</span>
            </div>
        </div>

        <form action={clientLogout}>
          <button 
            type="submit"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-md hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Odhlásit</span>
          </button>
        </form>
      </div>
    </header>
  );
}
