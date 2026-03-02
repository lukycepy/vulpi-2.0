
"use client";

import { useState } from "react";
import { requestEmergencyAccess, setEmergencyContact } from "@/actions/security";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

export function EmergencyAccessSettings({ users, currentContactId, organizationId }: { users: any[], currentContactId?: string, organizationId: string }) {
  const [selectedContactId, setSelectedContactId] = useState(currentContactId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setEmergencyContact(selectedContactId);
      toast({ title: "Nouzový kontakt uložen", variant: "default" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAccess = async () => {
      if (!confirm("Opravdu chcete požádat o nouzový přístup? Tato akce bude zaznamenána a notifikována všem správcům.")) return;
      
      setIsRequesting(true);
      try {
          await requestEmergencyAccess(organizationId);
          toast({ title: "Žádost odeslána", description: "Vaše žádost o nouzový přístup byla zaznamenána.", variant: "default" });
      } catch (e: any) {
          toast({ title: "Chyba při žádosti", description: e.message, variant: "destructive" });
      } finally {
          setIsRequesting(false);
      }
  };

  return (
    <div className="space-y-6 border p-6 rounded-lg bg-card shadow-sm">
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Nouzový přístup (Emergency Access)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
            Definujte osobu, která může v případě krize (např. ztráta přístupu hlavního admina) požádat o převzetí administrátorských práv.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium mb-1">Nouzový kontakt</label>
          <select 
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">-- Vyberte uživatele --</option>
            {users.map((u: any) => (
              <option key={u.user.id} value={u.user.id}>
                {u.user.firstName} {u.user.lastName} ({u.user.email})
              </option>
            ))}
          </select>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving || !selectedContactId}
          className="w-full md:w-auto"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Uložit kontakt
        </Button>
      </div>

      <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Akce pro nouzový kontakt</h4>
          <p className="text-xs text-muted-foreground mb-4">
              Pokud jste nouzový kontakt a nemůžete se spojit s administrátorem, můžete požádat o přístup zde.
          </p>
          <Button 
            variant="destructive" 
            onClick={handleRequestAccess} 
            disabled={isRequesting}
            className="w-full md:w-auto"
          >
            {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Požádat o nouzový ADMIN přístup
          </Button>
      </div>
    </div>
  );
}
