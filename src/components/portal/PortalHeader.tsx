"use client";

import { clientLogout } from "@/actions/portal";
import { LogOut } from "lucide-react";
import Link from "next/link";

export default function PortalHeader({ clientName }: { clientName: string }) {
  return (
    <header className="border-b bg-white dark:bg-gray-950 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/portal" className="text-xl font-bold text-gray-900 dark:text-white">
          Klientská zóna
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Přihlášen: <span className="font-medium text-gray-900 dark:text-white">{clientName}</span>
        </span>
        <form action={clientLogout}>
          <button 
            type="submit"
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit se
          </button>
        </form>
      </div>
    </header>
  );
}
