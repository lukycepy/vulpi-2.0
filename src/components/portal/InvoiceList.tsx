"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, Download, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED" | "PARTIAL" | "PENDING_APPROVAL";

interface Invoice {
  id: string;
  number: string;
  status: string;
  issuedAt: Date;
  dueAt: Date;
  totalAmount: number;
  paidAmount: number;
  currency: string;
}

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Moje faktury</h2>
      </div>
      
      {invoices.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Zatím zde nejsou žádné faktury.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
            >
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
                      Zbývá uhradit: <span className="text-red-600 font-medium">{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  href={`/portal/invoices/${invoice.id}`}
                  className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
