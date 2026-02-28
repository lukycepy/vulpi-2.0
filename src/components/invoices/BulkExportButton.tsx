"use client";

import { useState } from "react";
import { Download, Loader2, FileJson } from "lucide-react";
import { exportFilteredInvoices } from "@/actions/exports";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkExportButtonProps {
  searchParams: {
    query?: string;
    status?: string;
  };
}

export function BulkExportButton({ searchParams }: BulkExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (format: "ISDOC" | "POHODA" | "MONEY") => {
    try {
      setLoading(format);
      
      const { content, filename } = await exportFilteredInvoices(searchParams, format);
      
      // Create blob and download
      const blob = new Blob([content], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert(error instanceof Error ? error.message : "Export se nezdařil");
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
          disabled={!!loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>Exportovat vše</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("POHODA")} disabled={!!loading}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Pohoda (XML)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("MONEY")} disabled={!!loading}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Money S3 (XML)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("ISDOC")} disabled={true} title="Hromadný export není podporován">
          <FileJson className="mr-2 h-4 w-4 opacity-50" />
          <span className="opacity-50">ISDOC (nepodporováno)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
