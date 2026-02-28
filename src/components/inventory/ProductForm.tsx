"use client";

import { createProduct } from "@/actions/inventory";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function ProductForm({ canViewMargins = true }: { canViewMargins?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nový produkt
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Přidat nový produkt</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createProduct} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Název produktu *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Např. Kancelářský papír A4"
            />
          </div>
          
          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              Kód (SKU)
            </label>
            <input
              type="text"
              name="sku"
              id="sku"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="PAP-A4-001"
            />
          </div>
          
          <div>
            <label htmlFor="ean" className="block text-sm font-medium mb-1">
              EAN (Čárový kód)
            </label>
            <input
              type="text"
              name="ean"
              id="ean"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="859..."
            />
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium mb-1">
              Jednotka
            </label>
            <select
              name="unit"
              id="unit"
              className="w-full p-2 border rounded-md bg-background"
              defaultValue="ks"
            >
              <option value="ks">ks</option>
              <option value="kg">kg</option>
              <option value="m">m</option>
              <option value="l">l</option>
              <option value="bal">bal</option>
              <option value="hod">hod</option>
            </select>
          </div>
          
          {canViewMargins && (
            <div>
              <label htmlFor="buyPrice" className="block text-sm font-medium mb-1">
                Nákupní cena (bez DPH)
              </label>
              <input
                type="number"
                name="buyPrice"
                id="buyPrice"
                step="0.01"
                className="w-full p-2 border rounded-md bg-background"
                placeholder="0.00"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="sellPrice" className="block text-sm font-medium mb-1">
              Prodejní cena (bez DPH)
            </label>
            <input
              type="number"
              name="sellPrice"
              id="sellPrice"
              step="0.01"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="minStockLevel" className="block text-sm font-medium mb-1">
              Minimální stav zásob
            </label>
            <input
              type="number"
              name="minStockLevel"
              id="minStockLevel"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="10"
            />
          </div>

          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium mb-1">
              Počáteční stav
            </label>
            <input
              type="number"
              name="stockQuantity"
              id="stockQuantity"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Uložit produkt
          </button>
        </div>
      </form>
    </div>
  );
}
