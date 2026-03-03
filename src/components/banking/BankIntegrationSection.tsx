
"use client";

import { useState } from "react";
import { addBankIntegration } from "@/actions/organization";
import { BankIntegrationForm } from "@/components/banking/BankIntegrationForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BankIntegrationSectionProps {
  organizationId: string;
}

export function BankIntegrationSection({ organizationId }: BankIntegrationSectionProps) {
  const [provider, setProvider] = useState<string>("FIO");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApiSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
        await addBankIntegration({
            provider: formData.get("provider") as string,
            token: formData.get("token") as string,
            key: (formData.get("key") as string) || undefined,
        });
        toast({ title: "Integrace přidána", description: "Bankovní spojení bylo úspěšně nastaveno." });
    } catch (error: any) {
        toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-medium mb-3">Přidat integraci</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">Banka / Poskytovatel</span>
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
            >
                <option value="FIO">Fio banka (API)</option>
                <option value="RB">Raiffeisenbank (API)</option>
                <option value="IMAP">Jiná banka (Email/IMAP)</option>
            </select>
          </label>
        </div>

        {provider === "IMAP" ? (
            <BankIntegrationForm organizationId={organizationId} />
        ) : (
            <form action={handleApiSubmit} className="grid gap-4">
                <input type="hidden" name="provider" value={provider} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        name="token"
                        placeholder="API token"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                    />
                     <input
                        name="key"
                        placeholder="Klíč / certifikát (volitelné)"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
               
                <Button type="submit" disabled={loading} className="w-fit">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Přidat API integraci
                </Button>
            </form>
        )}
      </div>
    </div>
  );
}
