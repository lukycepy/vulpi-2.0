
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "./InvoicePDF";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { generateBarcodeDataUrl } from "@/lib/barcode";

interface DownloadPDFButtonProps {
  invoice: any; // Type this properly
  qrCodeUrl: string;
}

export function DownloadPDFButton({ invoice, qrCodeUrl }: DownloadPDFButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [barcodes, setBarcodes] = useState<Record<string, string>>({});
  const [loadingBarcodes, setLoadingBarcodes] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const loadBarcodes = async () => {
      if (invoice.template?.showBarcodes) {
        setLoadingBarcodes(true);
        const newBarcodes: Record<string, string> = {};
        for (const item of invoice.items) {
          if (item.sku) {
            try {
              newBarcodes[item.id] = await generateBarcodeDataUrl(item.sku);
            } catch (e) {
              console.error(`Failed to generate barcode for SKU ${item.sku}`, e);
            }
          }
        }
        setBarcodes(newBarcodes);
        setLoadingBarcodes(false);
      }
    };
    
    loadBarcodes();
  }, [invoice]);

  if (!isClient || loadingBarcodes) {
    return (
      <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingBarcodes ? "Generuji čárové kódy..." : "Načítám PDF..."}
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} qrCodeUrl={qrCodeUrl} barcodes={barcodes} />}
      fileName={`faktura-${invoice.number}.pdf`}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generuji PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Stáhnout PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
