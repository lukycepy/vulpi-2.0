
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateSPDCString, generateQRCode } from "@/lib/qr";
import Link from "next/link";
import { ArrowLeft, Building2, User, CreditCard, Calendar, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { AttachmentManager } from "@/components/invoices/AttachmentManager";
import { ExportButton } from "@/components/invoices/ExportButton";

// Dynamically import DownloadPDFButton to avoid SSR issues with @react-pdf/renderer
const DownloadPDFButtonClient = dynamic(
  () => import("@/components/invoices/DownloadPDFButton").then((mod) => mod.DownloadPDFButton),
  { ssr: false }
);

const DownloadTimeSheetButtonClient = dynamic(
  () => import("@/components/invoices/DownloadTimeSheetButton").then((mod) => mod.DownloadTimeSheetButton),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage(props: PageProps) {
  const params = await props.params;
  const { id } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      organization: true,
      client: true,
      items: true,
      bankDetail: true,
      attachments: true,
      project: {
        include: {
          timeEntries: {
            include: {
              user: true,
            },
            orderBy: {
              startTime: 'desc',
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Generate QR Code
  let qrCodeUrl = "";
  if (invoice.bankDetail && invoice.bankDetail.iban) {
    const paymentData = {
      iban: invoice.bankDetail.iban,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      variableSymbol: invoice.variableSymbol || invoice.number, // Fallback to invoice number if VS is missing
      message: `Faktura ${invoice.number}`,
      date: invoice.dueAt,
    };
    const spdcString = generateSPDCString(paymentData);
    qrCodeUrl = await generateQRCode(spdcString);
  }

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ISSUED: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    OVERDUE: "bg-orange-100 text-orange-800",
  };

  const statusLabels = {
    DRAFT: "Návrh",
    ISSUED: "Vystaveno",
    PAID: "Zaplaceno",
    CANCELLED: "Zrušeno",
    OVERDUE: "Po splatnosti",
  };

  const isOverdue = new Date() > new Date(invoice.dueAt) && invoice.status !== "PAID" && invoice.status !== "CANCELLED";
  const status = isOverdue ? "OVERDUE" : (invoice.status as keyof typeof statusLabels);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/invoices" className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faktura {invoice.number}</h1>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"}`}>
                {statusLabels[status] || status}
              </span>
              <span className="text-sm text-muted-foreground">
                Vystaveno: {formatDate(invoice.issuedAt)}
              </span>
              {invoice.isLocked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Uzamčeno
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {invoice.project && (
            <DownloadTimeSheetButtonClient 
              invoice={invoice} 
              project={invoice.project} 
              timeEntries={invoice.project.timeEntries} 
            />
          )}
          <ExportButton invoiceId={invoice.id} />
          <DownloadPDFButtonClient invoice={invoice} qrCodeUrl={qrCodeUrl} />
          <InvoiceActions invoice={{
            id: invoice.id,
            status: invoice.status,
            isLocked: invoice.isLocked,
            type: invoice.type
          }} />
        </div>
      </div>
          
          {invoice.type === 'FAKTURA' && (
            <Link href={`/invoices/new?from=${invoice.id}&mode=credit_note`} className="px-4 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50 text-sm flex items-center">
              Vytvořit dobropis
            </Link>
          )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Supplier */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b pb-4">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Dodavatel</h2>
          </div>
          <div className="space-y-1">
            <p className="font-medium">{invoice.organization.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.organization.address}</p>
            <div className="pt-2 text-sm">
              <p>IČ: {invoice.organization.taxId}</p>
              {invoice.organization.vatId && <p>DIČ: {invoice.organization.vatId}</p>}
            </div>
          </div>
          
          {invoice.bankDetail && (
            <div className="pt-4 border-t mt-4 space-y-1">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Bankovní spojení</h3>
              </div>
              <p className="text-sm">{invoice.bankDetail.accountNumber}/{invoice.bankDetail.bankCode}</p>
              <p className="text-sm text-muted-foreground">{invoice.bankDetail.bankName}</p>
              {invoice.bankDetail.iban && <p className="text-sm text-muted-foreground">IBAN: {invoice.bankDetail.iban}</p>}
            </div>
          )}
        </div>

        {/* Client */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b pb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Odběratel</h2>
          </div>
          <div className="space-y-1">
            <p className="font-medium">{invoice.client.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
            <div className="pt-2 text-sm">
              {invoice.client.taxId && <p>IČ: {invoice.client.taxId}</p>}
              {invoice.client.vatId && <p>DIČ: {invoice.client.vatId}</p>}
            </div>
          </div>

          <div className="pt-4 border-t mt-4 space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Datum vystavení:</span>
               <span>{formatDate(invoice.issuedAt)}</span>
             </div>
             <div className="flex justify-between text-sm font-medium">
               <span className="text-muted-foreground">Datum splatnosti:</span>
               <span className={isOverdue ? "text-red-600" : ""}>{formatDate(invoice.dueAt)}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Variabilní symbol:</span>
               <span>{invoice.variableSymbol || "-"}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <FileText className="w-5 h-5 mr-2 text-muted-foreground" />
            Položky faktury
          </h2>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b bg-muted/50">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Popis</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Množství</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cena/j</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">DPH</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Celkem</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">{item.description}</td>
                  <td className="p-4 align-middle text-right">{item.quantity}</td>
                  <td className="p-4 align-middle text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="p-4 align-middle text-right">{item.vatRate}%</td>
                  <td className="p-4 align-middle text-right font-medium">{formatCurrency(item.totalAmount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-muted/10 border-t">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Základ daně:</span>
                <span>{formatCurrency(invoice.totalAmount - invoice.totalVat, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DPH:</span>
                <span>{formatCurrency(invoice.totalVat, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Celkem k úhradě:</span>
                <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AttachmentManager 
        invoiceId={invoice.id} 
        isLocked={invoice.isLocked} 
        attachments={invoice.attachments} 
      />

      {/* QR Code Preview */}
      {qrCodeUrl && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 w-fit">
          <h3 className="font-semibold mb-4">QR Platba</h3>
          <img src={qrCodeUrl} alt="QR Platba" className="w-32 h-32 border" />
          <p className="text-xs text-muted-foreground mt-2 text-center">Naskenujte pro platbu</p>
        </div>
      )}
    </div>
  );
}
