
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { ForgottenClient } from "@/services/dashboard";

interface ForgottenInvoicesAlertProps {
  clients: ForgottenClient[];
}

export function ForgottenInvoicesAlert({ clients }: ForgottenInvoicesAlertProps) {
  if (clients.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900 mb-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
        <div className="flex-1">
          <h5 className="mb-1 font-medium leading-none tracking-tight text-orange-800">
            Možná jste zapomněli vystavit fakturu
          </h5>
          <div className="text-sm opacity-90 mt-2">
            <p className="mb-2">
              Následující klienti obvykle dostávají fakturu každý měsíc, ale v tomto měsíci zatím žádnou nemají:
            </p>
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.id} className="flex items-center flex-wrap gap-2 bg-white/50 p-2 rounded-md">
                  <span className="font-semibold">{client.name}</span>
                  <span className="text-orange-700/80 text-xs">
                    (Naposledy: {format(new Date(client.lastInvoiceDate), "d. MMMM yyyy", { locale: cs })})
                  </span>
                  <Link 
                    href={`/invoices/new?clientId=${client.id}`}
                    className="ml-auto inline-flex items-center text-xs font-semibold text-orange-700 hover:text-orange-900 bg-white px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    Vystavit fakturu <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
