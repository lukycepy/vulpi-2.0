"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, Download, AlertTriangle, CheckCircle, Clock, FileText, Loader2, CheckSquare, Square, X } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useState } from "react";
import { bulkMarkAsPaid, getInvoicesForExport } from "@/actions/invoice";
import { pdf, Document } from '@react-pdf/renderer';
import { InvoicePage } from "@/components/invoices/InvoicePDF";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED" | "PARTIAL" | "PENDING_APPROVAL";

interface Invoice {
  id: string;
  number: string;
  status: string;
  issuedAt: Date;
  dueAt: Date;
  totalAmount: number;
  paidAmount: number | null;
  currency: string;
}

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const { displayedItems: displayedInvoices, observerTarget } = useInfiniteScroll(invoices);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedInvoices.length && displayedInvoices.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedInvoices.map(i => i.id)));
    }
  };

  const handleBulkPay = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Opravdu chcete označit ${selectedIds.size} faktur jako uhrazené?`)) return;

    setIsProcessing(true);
    try {
      await bulkMarkAsPaid(Array.from(selectedIds));
      setSelectedIds(new Set());
      // Revalidation happens on server, but we might want to show success
      alert("Faktury byly označeny jako uhrazené.");
    } catch (error) {
      console.error(error);
      alert("Chyba při aktualizaci faktur.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const data = await getInvoicesForExport(Array.from(selectedIds));
      
      // Generate PDF
      const doc = (
        <Document>
          {data.map((invoice: any) => (
            <InvoicePage key={invoice.id} invoice={invoice} />
          ))}
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faktury_export_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error(error);
      alert("Chyba při generování PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Zaplaceno
          </span>
        );
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            K úhradě
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            <Clock className="w-3 h-3" />
            Částečně uhrazeno
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <FileText className="w-3 h-3" />
            Zrušeno
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-blue-50 dark:bg-blue-900/50 p-4 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
               Vybráno: {selectedIds.size}
             </span>
             <button 
               onClick={() => setSelectedIds(new Set())}
               className="text-xs text-blue-600 dark:text-blue-300 hover:underline"
             >
               Zrušit výběr
             </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkPay}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2 text-green-600" />}
              Označit uhrazené
            </button>
            <button
              onClick={handleBulkDownload}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Stáhnout PDF
            </button>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSelectAll}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {selectedIds.size > 0 && selectedIds.size === displayedInvoices.length ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Moje faktury</h2>
        </div>
      </div>
      
      {invoices.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Zatím zde nejsou žádné faktury.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {displayedInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${selectedIds.has(invoice.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleSelect(invoice.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {selectedIds.has(invoice.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base font-medium text-gray-900 dark:text-white truncate">
                    {invoice.number}
                  </span>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Vystaveno: {formatDate(invoice.issuedAt)}</span>
                  <span className={new Date(invoice.dueAt) < new Date() && invoice.status !== "PAID" ? "text-red-600 font-medium" : ""}>
                    Splatnost: {formatDate(invoice.dueAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(invoice.totalAmount)}
                  </div>
                  {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Zbývá uhradit: <span className="text-red-600 font-medium">{formatCurrency(invoice.totalAmount - (invoice.paidAmount ?? 0))}</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  href={`/portal/invoices/${invoice.id}`}
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
          {/* Loading sentinel */}
          {displayedInvoices.length < invoices.length && (
            <div ref={observerTarget} className="p-4 flex justify-center items-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Načítám další faktury...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
