"use client";

import { exportInvoice } from "@/actions/exports";
import { useState } from "react";
import { Download, FileText } from "lucide-react";

export function ExportButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: "ISDOC" | "POHODA" | "MONEY") => {
    try {
      setLoading(true);
      setIsOpen(false);
      const { content, filename } = await exportInvoice(invoiceId, format);
      
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
      console.error(error);
      alert("Chyba při exportu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
      >
        <FileText className="mr-2 h-4 w-4" />
        {loading ? "Exportuji..." : "Export"}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={() => handleExport("ISDOC")}
                className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                ISDOC 6.0 (XML)
              </button>
              <button
                onClick={() => handleExport("POHODA")}
                className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                Pohoda (XML)
              </button>
              <button
                onClick={() => handleExport("MONEY")}
                className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                Money S3 (XML)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
