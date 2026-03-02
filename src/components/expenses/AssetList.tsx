"use client";

import { useState } from "react";
import { createAsset, deleteAsset } from "@/actions/assets";
import { Trash2, Plus, Calendar, DollarSign, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string | Date; // Raw SQL might return string
  depreciationYears: number;
}

export default function AssetList({ initialAssets }: { initialAssets: any[] }) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createAsset(formData);
      setIsAdding(false);
      router.refresh(); // Refresh server data
    } catch (err) {
      alert("Chyba při ukládání: " + err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu smazat tento majetek?")) return;
    try {
      await deleteAsset(id);
      router.refresh();
    } catch (err) {
      alert("Chyba při mazání: " + err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Seznam majetku</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Přidat majetek
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-card border p-4 rounded-lg space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Název majetku</label>
              <input name="name" required className="w-full p-2 border rounded bg-background" placeholder="Např. Notebook Dell XPS" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pořizovací cena (Kč)</label>
              <input name="purchasePrice" type="number" required min="0" step="0.01" className="w-full p-2 border rounded bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Datum pořízení</label>
              <input name="purchaseDate" type="date" required className="w-full p-2 border rounded bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Doba odpisování (roky)</label>
              <input name="depreciationYears" type="number" required min="1" max="50" defaultValue="3" className="w-full p-2 border rounded bg-background" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded hover:bg-accent">Zrušit</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Uložit</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialAssets.map((asset) => (
          <div key={asset.id} className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group">
            <button 
              onClick={() => handleDelete(asset.id)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              title="Smazat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            
            <h3 className="font-bold text-lg mb-2 pr-6">{asset.name}</h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-foreground font-medium">{Number(asset.purchasePrice).toLocaleString()} Kč</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(asset.purchaseDate).toLocaleDateString("cs-CZ")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Odpisy: {asset.depreciationYears} let</span>
              </div>
            </div>
          </div>
        ))}
        
        {initialAssets.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            Zatím nemáte žádný evidovaný majetek.
          </div>
        )}
      </div>
    </div>
  );
}
