import { getClientFromToken } from "@/actions/portal";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateSPDCString, generateQRCode } from "@/lib/qr";
import { DownloadPDFButton } from "@/components/invoices/DownloadPDFButton";
import DisputeForm from "@/components/portal/DisputeForm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, FileText } from "lucide-react";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientFromToken();
  if (!client) redirect("/portal/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      client: true,
      organization: true,
      bankDetail: true,
    },
  });

  if (!invoice || invoice.clientId !== client.id) {
    notFound();
  }

  // Generate QR Code
  let qrCodeUrl = "";
  if (invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.bankDetail) {
    const spdString = generateSPDCString({
      iban: invoice.bankDetail.iban || "",
      amount: invoice.totalAmount - invoice.paidAmount,
      currency: invoice.currency,
      variableSymbol: invoice.variableSymbol || invoice.number,
      message: `Faktura ${invoice.number}`,
      date: invoice.dueAt
    });
    qrCodeUrl = await generateQRCode(spdString);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        href="/portal"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Zpět na přehled
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Faktura {invoice.number}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                invoice.status === "PAID" ? "bg-green-100 text-green-800" : 
                invoice.status === "ISSUED" ? "bg-yellow-100 text-yellow-800" : 
                "bg-gray-100 text-gray-800"
              }`}>
                {invoice.status === "PAID" ? "ZAPLACENO" : invoice.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Vystaveno: {formatDate(invoice.issuedAt)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Splatnost: <span className="font-medium text-gray-900 dark:text-white">{formatDate(invoice.dueAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 items-end">
             <DownloadPDFButton invoice={invoice} qrCodeUrl={qrCodeUrl} />
             <DisputeForm invoiceId={invoice.id} />
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
          {/* Dodavatel */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Dodavatel</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{invoice.organization.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                  {invoice.organization.address}
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>IČ: {invoice.organization.taxId}</p>
                  <p>DIČ: {invoice.organization.vatId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Odběratel */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Odběratel</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{invoice.client.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                  {invoice.client.address}
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>IČ: {invoice.client.taxId}</p>
                  <p>DIČ: {invoice.client.vatId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Položky */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-3">Položka</th>
                <th className="px-6 py-3 text-right">Množství</th>
                <th className="px-6 py-3 text-right">Cena/jedn.</th>
                <th className="px-6 py-3 text-right">Celkem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.description}</td>
                  <td className="px-6 py-4 text-right">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-900/50 font-bold text-gray-900 dark:text-white">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right">Celkem k úhradě</td>
                <td className="px-6 py-4 text-right text-lg">{formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* QR Platba */}
        {qrCodeUrl && (
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <img src={qrCodeUrl} alt="QR Platba" className="w-32 h-32" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">QR Platba</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  Naskenujte QR kód ve svém mobilním bankovnictví pro rychlou úhradu faktury.
                  Jako variabilní symbol použijte <strong>{invoice.variableSymbol || invoice.number}</strong>.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-500 block">Číslo účtu</span>
                     <span className="font-mono font-medium">{invoice.bankDetail?.accountNumber}/{invoice.bankDetail?.bankName}</span>
                   </div>
                   <div>
                     <span className="text-gray-500 block">IBAN</span>
                     <span className="font-mono font-medium">{invoice.bankDetail?.iban}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
