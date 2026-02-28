"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  toggleInvoiceLock, 
  updateInvoiceStatus, 
  deleteInvoice 
} from "@/actions/invoice";
import Link from "next/link";
import { 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  FileInput
} from "lucide-react";

interface InvoiceActionsProps {
  invoice: {
    id: string;
    status: string;
    isLocked: boolean;
    type: string; // FAKTURA, PROFORMA, NABIDKA, DOBROPIS
  };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLockToggle = async () => {
    try {
      setLoading(true);
      await toggleInvoiceLock(invoice.id);
      router.refresh();
    } catch (error) {
      alert("Chyba při změně zámku: " + (error instanceof Error ? error.message : "Neznámá chyba"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      setLoading(true);
      await updateInvoiceStatus(invoice.id, status);
      router.refresh();
    } catch (error) {
      alert("Chyba při změně stavu: " + (error instanceof Error ? error.message : "Neznámá chyba"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Opravdu chcete smazat tento doklad? Tato akce je nevratná.")) return;
    
    try {
      setLoading(true);
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (error) {
      alert("Chyba při mazání: " + (error instanceof Error ? error.message : "Neznámá chyba"));
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Status Actions */}
      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
        <button
          onClick={() => handleStatusChange("PAID")}
          disabled={loading}
          className="px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded flex items-center gap-2"
          title="Označit jako uhrazené"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Uhrazeno</span>
        </button>
      )}

      {/* Primary Actions based on Lock State */}
      {invoice.isLocked ? (
        <button
          onClick={handleLockToggle}
          disabled={loading}
          className="px-3 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Odemknout</span>
        </button>
      ) : (
        <>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Upravit</span>
          </Link>
          
          <button
            onClick={handleLockToggle}
            disabled={loading}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center gap-2"
            title="Uzamknout proti změnám"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </>
      )}

      {/* More Menu / Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded flex items-center gap-2"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10 py-1">
            <button
              onClick={() => {
                setShowMenu(false);
                router.push(`/invoices/new?from=${invoice.id}&mode=duplicate`);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FileInput className="w-4 h-4" /> Duplikovat
            </button>
            
            {(invoice.type === 'NABIDKA' || invoice.type === 'PROFORMA') && (
              <button
                 onClick={() => {
                    setShowMenu(false);
                    router.push(`/invoices/new?from=${invoice.id}&mode=convert`);
                 }}
                 className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Vytvořit fakturu
              </button>
            )}

            <button
               onClick={() => {
                  setShowMenu(false);
                  router.push(`/invoices/new?from=${invoice.id}&mode=credit_note`);
               }}
               className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <FileInput className="w-4 h-4" /> Vytvořit dobropis
            </button>

            {invoice.status !== "CANCELLED" && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleStatusChange("CANCELLED");
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Stornovat
              </button>
            )}

            {!invoice.isLocked && (
              <>
                <div className="border-t my-1"></div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Smazat
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  );
}
