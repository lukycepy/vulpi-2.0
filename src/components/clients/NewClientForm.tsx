"use client";

import { useState } from "react";
import { fetchCompanyByIco } from "@/services/ares";
import { createClient } from "@/actions/client";

export default function NewClientForm() {
  const [loading, setLoading] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    vatId: "",
    address: "",
    email: "",
    phone: "",
    dueDays: "14",
  });

  const handleAresLookup = async () => {
    if (!formData.taxId || formData.taxId.length < 8) return;
    
    setAresLoading(true);
    try {
      // Note: fetchCompanyByIco is a server function but we imported it directly. 
      // Ideally this should be a Server Action or API route. 
      // Since I defined it as a regular export in src/services/ares.ts, 
      // I need to make sure it's marked "use server" if I want to call it from client, 
      // OR wrap it in a server action. 
      // Let's create a wrapper action for ARES or just call it if it's safe. 
      // Actually fetchCompanyByIco uses fetch, so it can run on client too if CORS allows, 
      // but ARES usually requires proxy or server-side call due to CORS or to be safe.
      // Let's assume I need to wrap it.
      
      // I will create a server action wrapper right here for simplicity in a real app, 
      // but for now let's assume I update ares.ts to be "use server".
      
      // ... Wait, I can't edit ares.ts easily inside this thinking block without a tool call.
      // I'll skip the ARES call here and implement it as a separate server action in a moment.
    } catch (e) {
      console.error(e);
    } finally {
      setAresLoading(false);
    }
  };

  return (
    <form action={async (formData) => {
        setLoading(true);
        await createClient({
            name: formData.get("name") as string,
            taxId: formData.get("taxId") as string,
            vatId: formData.get("vatId") as string,
            address: formData.get("address") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            defaultDueDays: Number(formData.get("dueDays")) || 14,
        });
        setLoading(false);
        // Reset form or close modal
    }} className="grid gap-4 border p-4 rounded-md">
      <h3 className="font-semibold">Nový klient</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">IČO</label>
          <div className="flex gap-2">
            <input 
              name="taxId" 
              value={formData.taxId}
              onChange={e => setFormData({...formData, taxId: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {/* ARES Button would go here */}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">DIČ</label>
          <input 
            name="vatId" 
            value={formData.vatId}
            onChange={e => setFormData({...formData, vatId: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Název firmy</label>
        <input 
          name="name" 
          required
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Adresa</label>
        <textarea 
          name="address" 
          value={formData.address}
          onChange={e => setFormData({...formData, address: e.target.value})}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            name="email" 
            type="email"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Splatnost (dny)</label>
          <input 
            name="dueDays" 
            type="number"
            defaultValue={14}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-full">
        {loading ? "Ukládám..." : "Vytvořit klienta"}
      </button>
    </form>
  );
}
