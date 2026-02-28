"use client";

import { createVehicle } from "@/actions/inventory";
import { useState } from "react";
import { Car, Plus } from "lucide-react";

export default function VehicleForm() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nové vozidlo
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          Přidat vozidlo
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createVehicle} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Název / Model *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Škoda Octavia"
            />
          </div>
          
          <div>
            <label htmlFor="plate" className="block text-sm font-medium mb-1">
              SPZ *
            </label>
            <input
              type="text"
              name="plate"
              id="plate"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="1A2 3456"
            />
          </div>
          
          <div>
            <label htmlFor="fuelType" className="block text-sm font-medium mb-1">
              Palivo
            </label>
            <select
              name="fuelType"
              id="fuelType"
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="DIESEL">Nafta</option>
              <option value="PETROL">Benzín</option>
              <option value="ELECTRIC">Elektro</option>
              <option value="HYBRID">Hybrid</option>
              <option value="LPG">LPG/CNG</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Uložit vozidlo
          </button>
        </div>
      </form>
    </div>
  );
}
