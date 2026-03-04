
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { switchOrganization } from "@/actions/auth";

interface OrganizationSwitcherProps {
  organizations: {
    id: string;
    name: string;
  }[];
  currentOrganizationId: string | null;
}

export function OrganizationSwitcher({
  organizations,
  currentOrganizationId,
}: OrganizationSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");

  const currentOrg = organizations.find((org) => org.id === currentOrganizationId);
  const filteredOrganizations = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((org) => org.name.toLowerCase().includes(q));
  }, [organizations, query]);

  const onSelect = (orgId: string) => {
    setOpen(false);
    setQuery("");
    startTransition(async () => {
        await switchOrganization(orgId);
    });
  };

  if (organizations.length <= 1) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hidden md:flex"
          disabled={isPending}
        >
          {isPending ? (
             <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 animate-pulse" />
                Přepínám...
             </span>
          ) : currentOrg ? (
            <span className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {currentOrg.name}
            </span>
          ) : (
            "Vyberte organizaci..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="p-2 border-b">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat organizaci..."
          />
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {filteredOrganizations.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Žádná organizace nenalezena.
            </div>
          ) : (
            filteredOrganizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => onSelect(org.id)}
                className={cn(
                  "w-full flex items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  currentOrganizationId === org.id && "bg-accent text-accent-foreground"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    currentOrganizationId === org.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{org.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
