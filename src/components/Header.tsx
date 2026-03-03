
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveTimeEntry } from "@/services/time-tracking";
import TimerWidget from "@/components/time-tracking/TimerWidget";
import { getCurrentUser, getUserPermissions, getCurrentMembership } from "@/lib/auth-permissions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { switchOrganization } from "@/actions/auth";
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
  Users,
  User as UserIcon,
  ShieldAlert,
  Webhook,
  ExternalLink,
  Check
} from "lucide-react";

import { CoffeeBreakButton } from "@/components/ui/CoffeeBreakButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default async function Header() {
  const user = await getCurrentUser();
  let activeTimer = null;
  let permissions: string[] = [];
  let userAvatar = null;
  let userMemberships: any[] = [];
  let currentMembership = null;

  if (user) {
    userAvatar = user.avatarUrl;
    currentMembership = await getCurrentMembership(user.id);

    if (currentMembership) {
        permissions = await getUserPermissions(user.id, currentMembership.organizationId);
    }

    userMemberships = await prisma.membership.findMany({
        where: { userId: user.id },
        include: { organization: true }
    });

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
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="h-16 flex items-center justify-between px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-8">
          <div className="md:hidden">
             <Link href="/" className="font-bold text-xl flex items-center gap-2">
                <span className="bg-primary text-primary-foreground p-1 rounded">V</span>
                Vulpi
             </Link>
          </div>

          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:block">
               <TimerWidget activeEntry={activeTimer} />
            </div>
          )}
          
          <CoffeeBreakButton />

          {user ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar || ""} alt={user.email} />
                      <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Můj profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/organization">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Nastavení organizace</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/integrations">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Bankovní integrace</span>
                    </Link>
                  </DropdownMenuItem>

                  {userMemberships.length > 1 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Přepnout organizaci</DropdownMenuLabel>
                        {userMemberships.map((m) => (
                            <DropdownMenuItem key={m.id} asChild>
                                <form action={switchOrganization.bind(null, m.organizationId)} className="w-full cursor-pointer">
                                    <button className="flex w-full items-center justify-between">
                                        <span className={m.organizationId === currentMembership?.organizationId ? "font-bold" : ""}>
                                            {m.organization.name}
                                        </span>
                                        {m.organizationId === currentMembership?.organizationId && <Check className="h-4 w-4 text-primary" />}
                                    </button>
                                </form>
                            </DropdownMenuItem>
                        ))}
                    </>
                  )}
                  
                  {canManageSettings && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-red-600 font-bold text-xs uppercase tracking-wider">
                            Superadmin
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href="/settings/users" className="text-red-600 focus:text-red-600">
                                <Users className="mr-2 h-4 w-4" />
                                <span>Uživatelé</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings/developers/webhooks" className="text-red-600 focus:text-red-600">
                                <Webhook className="mr-2 h-4 w-4" />
                                <span>Webhooky</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings/danger-zone" className="text-red-600 focus:text-red-600">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                <span>Danger Zone</span>
                            </Link>
                        </DropdownMenuItem>
                      </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={async () => {
                      "use server";
                      const { cookies } = await import("next/headers");
                      const cookieStore = await cookies();
                      cookieStore.delete("auth_token");
                      cookieStore.delete("impersonated_user_id");
                    }} className="w-full">
                      <button className="flex w-full items-center text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Odhlásit se</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline">
              Přihlásit se
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
