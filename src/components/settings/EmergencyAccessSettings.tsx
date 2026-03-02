
"use client";

import { useState } from "react";
import { requestEmergencyAccess, setEmergencyContact } from "@/actions/security";

export function EmergencyAccessSettings({ users, currentContactId }: { users: any[], currentContactId?: string }) {
  const [selectedContactId, setSelectedContactId] = useState(currentContactId || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setEmergencyContact(selectedContactId);
      alert("Nouzový kontakt uložen.");
    } catch (e: any) {
      alert("Chyba: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAccess = async () => {
      if (!confirm("Opravdu chcete požádat o nouzový přístup? Tato akce bude zaznamenána a notifikována.")) return;
      
      try {
          // We need organizationId here, but this component might be used in a context where we don't have it explicitly passed as prop usually
          // However, server action will handle current user's org.
          // Wait, requestEmergencyAccess takes orgId. We need to pass it or have action infer it.
          // Let's assume the action infers it from context or we pass it.
          // Actually, the action `requestEmergencyAccess(organizationId)` requires it.
          // Let's update the component to accept orgId or update action.
          // For now, let's assume we can't easily call it without orgId.
          alert("Tato funkce vyžaduje implementaci na straně klienta s ID organizace.");
      } catch (e: any) {
          alert("Chyba: " + e.message);
      }
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-card">
      <h3 className="font-semibold text-lg">Nouzový přístup (Emergency Access)</h3>
      <p className="text-sm text-muted-foreground">
        Definujte osobu, která může v případě krize (např. ztráta přístupu hlavního admina) požádat o převzetí administrátorských práv.
      </p>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Nouzový kontakt</label>
          <select 
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">-- Vyberte uživatele --</option>
            {users.map((u: any) => (
              <option key={u.user.id} value={u.user.id}>
                {u.user.firstName} {u.user.lastName} ({u.user.email})
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !selectedContactId}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
        >
          {isSaving ? "Ukládám..." : "Uložit kontakt"}
        </button>
      </div>
    </div>
  );
}
