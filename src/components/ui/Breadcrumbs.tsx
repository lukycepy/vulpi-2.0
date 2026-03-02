"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const routeNameMap: Record<string, string> = {
  "invoices": "Faktury",
  "clients": "Klienti",
  "projects": "Projekty",
  "inventory": "Sklad",
  "settings": "Nastavení",
  "new": "Nová",
  "edit": "Úprava",
  "detail": "Detail",
  "dashboard": "Nástěnka",
  "disputes": "Reklamace",
  "ocr": "Vytěžování",
  "users": "Uživatelé",
  "roles": "Role",
  "custom-fields": "Vlastní pole",
  "templates": "Šablony",
  "organization": "Organizace",
  "health": "Stav systému",
  "time-tracking": "Výkazy času",
  "expenses": "Výdaje",
  "categories": "Kategorie",
  "vehicles": "Vozidla",
  "portal": "Klientský portál",
  "login": "Přihlášení"
}

export function Breadcrumbs() {
  const pathname = usePathname()
  
  if (pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-muted-foreground mb-4 md:mb-0">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`
        const isLast = index === segments.length - 1
        
        // Try to map segment to readable name, otherwise capitalize or use as is
        let name = routeNameMap[segment] || segment
        
        // Handle IDs (simple check if it looks like an ID or is long)
        if (segment.length > 20 || /^\d+$/.test(segment)) {
            name = "Detail"
        }

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link href={path} className="hover:text-foreground transition-colors">
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
