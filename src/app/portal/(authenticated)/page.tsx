import { getClientInvoices, getClientFromToken } from "@/actions/portal";
import InvoiceList from "@/components/portal/InvoiceList";
import { formatCurrency } from "@/lib/format";
import { redirect } from "next/navigation";
import { AlertTriangle, Archive, FileText } from "lucide-react";

export default async function PortalDashboard() {
  const client = await getClientFromToken();
  if (!client) redirect("/portal/login");

  const invoices = await getClientInvoices(client.id);
  const unpaidInvoices = invoices.filter(inv => inv.status !== "PAID" && inv.status !== "CANCELLED");
  
  const totalUnpaid = unpaidInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.paidAmount), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Přehled faktur</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vítejte ve své klientské zóně, {client.name}.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Celkem k úhradě</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalUnpaid)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <InvoiceList invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
