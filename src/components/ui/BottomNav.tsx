"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

import { CoffeeBreakButton } from "@/components/ui/CoffeeBreakButton"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    {
      href: "/",
      label: "Nástěnka",
      icon: LayoutDashboard,
      active: pathname === "/"
    },
    {
      href: "/invoices",
      label: "Faktury",
      icon: FileText,
      active: pathname.startsWith("/invoices")
    },
    {
      href: "/clients",
      label: "Klienti",
      icon: Users,
      active: pathname.startsWith("/clients")
    },
    {
        href: "/projects",
        label: "Projekty",
        icon: Briefcase,
        active: pathname.startsWith("/projects")
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t px-4 pb-safe pt-2 md:hidden">
      <nav className="flex justify-around items-center h-16">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-full h-full text-xs font-medium transition-colors",
              link.active 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </Link>
        ))}
        
        {/* Coffee Break Button */}
        <div className="flex flex-col items-center justify-center space-y-1 w-full h-full">
           <CoffeeBreakButton variant="nav-item" />
        </div>
      </nav>
    </div>
  )
}
