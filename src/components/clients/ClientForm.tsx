"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient, updateClient } from "@/actions/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { fetchAresData } from "@/actions/ares";
import { Loader2, Search } from "lucide-react";

interface ClientFormProps {
  initialData?: any;
}

export function ClientForm({ initialData }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    taxId: initialData?.taxId || "",
    vatId: initialData?.vatId || "",
    address: initialData?.address || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    web: initialData?.web || "",
    notes: initialData?.notes || "",
    mailingAddress: initialData?.mailingAddress || "",
    mailingCity: initialData?.mailingCity || "",
    mailingZip: initialData?.mailingZip || "",
    mailingCountry: initialData?.mailingCountry || "CZ",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAresLookup = async () => {
    if (!formData.taxId) return;
    
    setAresLoading(true);
    try {
      const data = await fetchAresData(formData.taxId);
      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          address: data.address || prev.address,
          vatId: data.vatId || prev.vatId,
          mailingCity: data.city || prev.mailingCity,
          mailingZip: data.zip || prev.mailingZip,
          // If address is structured, we might want to split it better, but for now simple fill
        }));
        toast({ title: "Načteno z ARES", description: "Údaje byly úspěšně doplněny." });
      } else {
        toast({ title: "Nenalezeno", description: "Subjekt s tímto IČO nebyl v ARES nalezen.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se načíst data z ARES.", variant: "destructive" });
    } finally {
      setAresLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (initialData?.id) {
        await updateClient(initialData.id, formData);
        toast({ title: "Uloženo", description: "Klient byl aktualizován." });
      } else {
        await createClient(formData);
        toast({ title: "Vytvořeno", description: "Nový klient byl úspěšně vytvořen." });
        router.push("/clients");
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="grid gap-4 p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Základní údaje</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxId">IČO</Label>
            <div className="flex gap-2">
              <Input 
                id="taxId" 
                name="taxId" 
                value={formData.taxId} 
                onChange={handleChange} 
                placeholder="12345678"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAresLookup} disabled={aresLoading || !formData.taxId}>
                {aresLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatId">DIČ</Label>
            <Input 
              id="vatId" 
              name="vatId" 
              value={formData.vatId} 
              onChange={handleChange} 
              placeholder="CZ12345678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Název firmy / Jméno</Label>
          <Input 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Sídlo (Ulice, Číslo, Město, PSČ)</Label>
          <Input 
            id="address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
          />
        </div>
      </div>

      <div className="grid gap-4 p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Kontaktní údaje</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="web">Web</Label>
            <Input 
              id="web" 
              name="web" 
              value={formData.web} 
              onChange={handleChange} 
              placeholder="https://..."
            />
        </div>
      </div>

      <div className="grid gap-4 p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-medium">Korespondenční adresa</h3>
        <div className="space-y-2">
            <Label htmlFor="mailingAddress">Ulice a číslo</Label>
            <Input 
              id="mailingAddress" 
              name="mailingAddress" 
              value={formData.mailingAddress} 
              onChange={handleChange} 
            />
        </div>
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
                <Label htmlFor="mailingZip">PSČ</Label>
                <Input 
                  id="mailingZip" 
                  name="mailingZip" 
                  value={formData.mailingZip} 
                  onChange={handleChange} 
                />
            </div>
            <div className="space-y-2 col-span-2">
                <Label htmlFor="mailingCity">Město</Label>
                <Input 
                  id="mailingCity" 
                  name="mailingCity" 
                  value={formData.mailingCity} 
                  onChange={handleChange} 
                />
            </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Poznámka</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange} 
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Zrušit
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Uložit změny" : "Vytvořit klienta"}
        </Button>
      </div>
    </form>
  );
}