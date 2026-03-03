
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Briefcase, Users, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentItem {
  title: string;
  url: string;
  icon: string; // We'll store icon name
  timestamp: number;
}

const ICON_MAP: Record<string, any> = {
  FileText,
  Briefcase,
  Users,
};

export function RecentItems({ isCollapsed }: { isCollapsed: boolean }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem("vulpi_recent_items");
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        // Dummy data for demo
        setItems([
          { title: "Faktura 2024001", url: "/invoices/demo-1", icon: "FileText", timestamp: Date.now() },
          { title: "Projekt Web", url: "/projects/demo-2", icon: "Briefcase", timestamp: Date.now() },
        ]);
      }
    } catch (e) {
      console.error("Failed to load recent items", e);
    }
  }, []);

  if (items.length === 0) return null;

  if (isCollapsed) {
      return (
          <div className="flex justify-center py-2 text-muted-foreground" title="Nedávno navštívené">
              <History className="h-4 w-4" />
          </div>
      );
  }

  return (
    <div className="px-2 pb-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 px-2">
        <History className="h-3 w-3" />
        <span>Nedávno navštívené</span>
      </div>
      <div className="space-y-1">
        {items.slice(0, 5).map((item, i) => {
          const Icon = ICON_MAP[item.icon] || FileText;
          return (
            <Link
              key={i}
              href={item.url}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors truncate"
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
