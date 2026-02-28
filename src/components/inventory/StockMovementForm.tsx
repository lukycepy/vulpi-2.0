"use client";

import { createStockMovement } from "@/actions/inventory";
import { useState } from "react";
import { ArrowLeftRight, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  unit: string;
}

export default function StockMovementForm({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Pohyb zboží
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Zaznamenat pohyb zásob
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createStockMovement} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium mb-1">
              Produkt *
            </label>
            <select
              name="productId"
              id="productId"
              required
              className="w-full p-2 border rounded-md bg-background"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Vyberte produkt --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Skladem: {product.stockQuantity} {product.unit})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Typ pohybu *
            </label>
            <select
              name="type"
              id="type"
              required
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="IN">Příjem (+)</option>
              <option value="OUT">Výdej (-)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              Množství *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="quantity"
                id="quantity"
                required
                min="0.01"
                step="0.01"
                className="w-full p-2 border rounded-md bg-background"
                placeholder="0.00"
              />
              <span className="text-sm text-muted-foreground w-12">
                {selectedProduct?.unit || "ks"}
              </span>
            </div>
          </div>
          
          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-1">
              Poznámka
            </label>
            <input
              type="text"
              name="note"
              id="note"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Důvod pohybu..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Uložit pohyb
          </button>
        </div>
      </form>
    </div>
  );
}
