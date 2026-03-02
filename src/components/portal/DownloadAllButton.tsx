
"use client";

import { useState } from "react";
import { Download, Loader2, Archive } from "lucide-react";
import { Invoice, Organization, Client, InvoiceItem, BankDetail, InvoiceTemplate } from "@prisma/client";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoices/InvoicePDF";
import JSZip from "jszip";
import { generateSPDCString, generateQRCode } from "@/lib/qr";
import { format } from "date-fns";

interface InvoiceWithRelations extends Invoice {
  items: InvoiceItem[];
  organization: Organization;
  client: Client;
  bankDetail: BankDetail | null;
  template: InvoiceTemplate | null;
}

interface DownloadAllButtonProps {
  invoices: InvoiceWithRelations[];
}

export default function DownloadAllButton({ invoices }: DownloadAllButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get available years from invoices
  const years = Array.from(new Set(invoices.map(inv => new Date(inv.issuedAt).getFullYear()))).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const defaultYear = years.includes(currentYear) ? currentYear : years[0] || currentYear;
  
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setProgress(0);
      
      const yearInvoices = invoices.filter(inv => new Date(inv.issuedAt).getFullYear() === selectedYear);
      
      if (yearInvoices.length === 0) {
        alert("Pro tento rok nejsou žádné faktury.");
        setLoading(false);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder(`faktury-${selectedYear}`);
      
      let processed = 0;
      
      // Process invoices sequentially to avoid memory issues? Or parallel?
      // Parallel is faster but heavier. Let's do batches or parallel.
      // For client-side, parallel is fine for reasonable numbers (e.g. < 50).
      
      const promises = yearInvoices.map(async (invoice) => {
        // 1. Generate QR Code
        let qrCodeUrl = "";
        if (invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.bankDetail) {
             const spdString = generateSPDCString({
               iban: invoice.bankDetail.iban || "",
               amount: invoice.totalAmount - (invoice.paidAmount ?? 0),
               currency: invoice.currency,
               variableSymbol: invoice.variableSymbol || invoice.number,
               message: `Faktura ${invoice.number}`,
               date: new Date(invoice.dueAt)
             });
             // qrCodeUrl = await generateQRCode(spdString); // generateQRCode is async
             // If generateQRCode fails or is slow, we might want to skip it or handle it.
             // We'll await it.
             try {
                qrCodeUrl = await generateQRCode(spdString);
             } catch (e) {
                console.error("QR Code generation failed", e);
             }
        }
        
        // 2. Generate PDF Blob
        const blob = await pdf(
          <InvoicePDF 
            invoice={invoice} 
            qrCodeUrl={qrCodeUrl} 
          />
        ).toBlob();
        
        // 3. Add to ZIP
        folder?.file(`faktura-${invoice.number}.pdf`, blob);
        
        processed++;
        setProgress(Math.round((processed / yearInvoices.length) * 100));
      });

      await Promise.all(promises);

      // 4. Generate ZIP blob
      const content = await zip.generateAsync({ type: "blob" });
      
      // 5. Download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faktury-${selectedYear}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download error:", error);
      alert("Chyba při generování archivu.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  if (years.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedYear} 
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress}%
          </>
        ) : (
          <>
            <Archive className="h-4 w-4" />
            Stáhnout ZIP
          </>
        )}
      </button>
    </div>
  );
}
