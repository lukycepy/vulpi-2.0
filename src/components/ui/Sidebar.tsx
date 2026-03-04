
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  ShoppingCart, 
  Users, 
  BarChart, 
  MessageSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Mail
} from "lucide-react";

interface SidebarProps {
  permissions: string[];
}

export function Sidebar({ permissions }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const canViewDashboard = permissions.includes("view_dashboard");
  const canManageInvoices = permissions.includes("manage_invoices");
  const canManageProjects = permissions.includes("manage_projects");
  const canManageInventory = permissions.includes("manage_inventory");
  const canManageClients = permissions.includes("manage_clients");
  const canManageSettings = permissions.some(p => ["manage_settings", "manage_users", "manage_roles", "manage_templates", "manage_custom_fields"].includes(p));
  const canManageDisputes = canManageInvoices || canManageClients;
  const canManageOCR = canManageInvoices || permissions.includes("manage_expenses");
  // Communication is available for those who can manage settings (Admin/Manager/Superadmin usually)
  // or explicit permission if we had one. Based on prompt: Admin, Superadmin, Manager.
  // These roles usually have 'manage_settings' or 'manage_invoices' + 'manage_users'.
  // Let's rely on manage_clients as a proxy for now, or just visible for everyone who can view dashboard?
  // Prompt says: Admin, Superadmin, Manager.
  // Let's assume if they can manage settings or clients, they are likely in that group.
  const canAccessCommunication = canManageSettings || canManageClients;

  const links = [
    { href: "/", label: "Přehled", icon: LayoutDashboard, visible: canViewDashboard },
    { href: "/invoices", label: "Faktury", icon: FileText, visible: canManageInvoices },
    { href: "/projects", label: "Projekty", icon: Briefcase, visible: canManageProjects },
    { href: "/inventory", label: "Sklad", icon: ShoppingCart, visible: canManageInventory },
    { href: "/clients", label: "Klienti", icon: Users, visible: canManageClients },
    { href: "/reports", label: "Reporty", icon: BarChart, visible: canViewDashboard },
    { href: "/disputes", label: "Reklamace", icon: MessageSquare, visible: canManageDisputes },
    { href: "/ocr", label: "OCR", icon: FileText, visible: canManageOCR },
    { href: "/communication", label: "Komunikace", icon: Mail, visible: canAccessCommunication },
    { href: "/settings", label: "Nastavení", icon: Settings, visible: canManageSettings },
  ];

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        {!isCollapsed && (
          <Link href="/" className="font-bold text-xl flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-primary text-primary-foreground p-1 rounded">V</span>
            Vulpi
          </Link>
        )}
        {isCollapsed && (
             <span className="bg-primary text-primary-foreground p-1 rounded mx-auto">V</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        {links.filter(l => l.visible).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
              pathname === link.href || pathname.startsWith(link.href + "/") 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? link.label : undefined}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{link.label}</span>}
          </Link>
        ))}
        
        <Link
            href="/portal/login"
            target="_blank"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium mt-auto text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Klientský portál" : undefined}
        >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Klientský portál</span>}
        </Link>
      </nav>

      <div className="p-2 border-t space-y-2">
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
