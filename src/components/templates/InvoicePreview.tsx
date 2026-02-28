"use client";

import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface InvoicePreviewProps {
  template: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoPosition: "left" | "center" | "right";
    showQrCode: boolean;
    showSignature: boolean;
    customCss?: string;
  };
  dummyData?: {
    organizationName: string;
    clientName: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
  };
}

export function InvoicePreview({ template, dummyData = {
  organizationName: "Moje Firma s.r.o.",
  clientName: "Zákazník a.s.",
  amount: 15000,
  currency: "CZK",
  invoiceNumber: "FV-2024-001"
} }: InvoicePreviewProps) {
  
  // Basic styles based on template
  const containerStyle = {
    fontFamily: template.fontFamily,
    borderColor: template.primaryColor,
  };
  
  const headerStyle = {
    color: template.primaryColor,
  };
  
  const secondaryStyle = {
    color: template.secondaryColor,
  };

  const logoAlignment = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[template.logoPosition] || "justify-start";

  return (
    <Card className="w-full h-full overflow-hidden border shadow-lg bg-white" style={containerStyle}>
      <CardContent className="p-8 h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className={`flex ${logoAlignment} mb-4`}>
          <div className="w-32 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
            LOGO
          </div>
        </div>
        
        <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: template.secondaryColor }}>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={headerStyle}>Faktura {dummyData.invoiceNumber}</h1>
            <p className="text-sm text-gray-500">Daňový doklad</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{dummyData.organizationName}</p>
            <p className="text-sm text-gray-500">IČ: 12345678</p>
            <p className="text-sm text-gray-500">DIČ: CZ12345678</p>
          </div>
        </div>
        
        {/* Client Info */}
        <div className="grid grid-cols-2 gap-8 py-4">
          <div>
            <h3 className="text-sm font-semibold mb-2" style={secondaryStyle}>Odběratel</h3>
            <p className="font-bold">{dummyData.clientName}</p>
            <p className="text-sm text-gray-500">Ulice 123</p>
            <p className="text-sm text-gray-500">100 00 Praha 1</p>
            <p className="text-sm text-gray-500 mt-1">IČ: 87654321</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Datum vystavení:</span>
              <span>{format(new Date(), "dd.MM.yyyy", { locale: cs })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Datum splatnosti:</span>
              <span className="font-semibold">{format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "dd.MM.yyyy", { locale: cs })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Variabilní symbol:</span>
              <span>2024001</span>
            </div>
          </div>
        </div>
        
        {/* Items Table */}
        <div className="flex-grow">
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: template.secondaryColor }}>
              <tr>
                <th className="text-left py-2" style={headerStyle}>Položka</th>
                <th className="text-right py-2" style={headerStyle}>Množství</th>
                <th className="text-right py-2" style={headerStyle}>Cena/mj</th>
                <th className="text-right py-2" style={headerStyle}>Celkem</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">Služba {i}</td>
                  <td className="text-right py-2">1 ks</td>
                  <td className="text-right py-2">5 000 Kč</td>
                  <td className="text-right py-2">5 000 Kč</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Totals */}
        <div className="flex justify-end pt-4 border-t" style={{ borderColor: template.primaryColor }}>
          <div className="w-1/2">
            <div className="flex justify-between text-lg font-bold" style={headerStyle}>
              <span>Celkem k úhradě</span>
              <span>{dummyData.amount.toLocaleString("cs-CZ")} {dummyData.currency}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-end mt-8 pt-8 border-t border-gray-100">
          {template.showQrCode && (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 mb-1 flex items-center justify-center text-xs text-gray-400">QR Platba</div>
              <span className="text-xs text-gray-500">QR Platba</span>
            </div>
          )}
          
          {template.showSignature && (
            <div className="flex flex-col items-center">
               <div className="w-32 h-16 border-b border-dashed border-gray-400 mb-1"></div>
               <span className="text-xs text-gray-500">Podpis a razítko</span>
            </div>
          )}
        </div>

        {/* Custom CSS Injection (for preview purposes, simplistic) */}
        {template.customCss && (
          <style dangerouslySetInnerHTML={{ __html: template.customCss }} />
        )}
      </CardContent>
    </Card>
  );
}
