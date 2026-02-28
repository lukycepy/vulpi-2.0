
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveTimeEntry } from "@/services/time-tracking";
import TimerWidget from "@/components/time-tracking/TimerWidget";
import { getCurrentUser, getUserPermissions } from "@/lib/auth-permissions";
import { 
  BarChart, 
  Briefcase, 
  CreditCard, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  MessageSquare,
  Settings, 
  ShoppingCart, 
  Users 
} from "lucide-react";

export default async function Header() {
  const user = await getCurrentUser();
  let activeTimer = null;
  let permissions: string[] = [];

  if (user) {
    const membership = await prisma.membership.findFirst({
        where: { userId: user.id }
    });

    if (membership) {
        permissions = await getUserPermissions(user.id, membership.organizationId);
    }

    const entry = await getActiveTimeEntry(user.id);
    if (entry) {
        activeTimer = {
            id: entry.id,
            startTime: entry.startTime,
            description: entry.description,
            project: entry.project ? {
                name: entry.project.name,
                color: entry.project.color
            } : null
        };
    }
  }

  const canViewDashboard = permissions.includes("view_dashboard");
  const canManageInvoices = permissions.includes("manage_invoices");
  const canManageProjects = permissions.includes("manage_projects");
  const canManageInventory = permissions.includes("manage_inventory");
  const canManageClients = permissions.includes("manage_clients");
  const canManageSettings = permissions.some(p => ["manage_settings", "manage_users", "manage_roles", "manage_templates", "manage_custom_fields"].includes(p));
  const canManageDisputes = canManageInvoices || canManageClients; // Usually tied to invoices or clients
  const canManageOCR = canManageInvoices || permissions.includes("manage_expenses");

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <span className="bg-primary text-primary-foreground p-1 rounded">V</span>
            Vulpi
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {canViewDashboard && (
              <Link href="/" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                Přehled
              </Link>
            )}
            {canManageInvoices && (
              <Link href="/invoices" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <FileText className="h-4 w-4" />
                Faktury
              </Link>
            )}
            {canManageProjects && (
              <Link href="/projects" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <Briefcase className="h-4 w-4" />
                Projekty
              </Link>
            )}
            {canManageInventory && (
              <Link href="/inventory" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <ShoppingCart className="h-4 w-4" />
                Sklad
              </Link>
            )}
            {canManageClients && (
              <Link href="/clients" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <Users className="h-4 w-4" />
                Klienti
              </Link>
            )}
            {canManageDisputes && (
              <Link href="/disputes" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <MessageSquare className="h-4 w-4" />
                Reklamace
              </Link>
            )}
            {canManageOCR && (
              <Link href="/ocr" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <FileText className="h-4 w-4" />
                OCR
              </Link>
            )}
            {canManageSettings && (
              <Link href="/settings" className="hover:text-foreground flex items-center gap-2 transition-colors">
                <Settings className="h-4 w-4" />
                Nastavení
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <TimerWidget activeEntry={activeTimer} />
          </div>
          
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="rounded-full" />
            ) : (
                <span className="font-bold text-xs">{user?.firstName?.[0] || "U"}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
