"use client";

import { createVehicleLog } from "@/actions/inventory";
import { useState } from "react";
import { MapPin, Plus } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
}

export default function VehicleLogForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nová jízda
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Zaznamenat jízdu
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createVehicleLog} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium mb-1">
              Vozidlo *
            </label>
            <select
              name="vehicleId"
              id="vehicleId"
              required
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">-- Vyberte vozidlo --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">
              Datum *
            </label>
            <input
              type="datetime-local"
              name="date"
              id="date"
              required
              defaultValue={new Date().toISOString().slice(0, 16)}
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="from" className="block text-sm font-medium mb-1">
              Odkud *
            </label>
            <input
              type="text"
              name="from"
              id="from"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Praha"
            />
          </div>
          
          <div>
            <label htmlFor="to" className="block text-sm font-medium mb-1">
              Kam *
            </label>
            <input
              type="text"
              name="to"
              id="to"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Brno"
            />
          </div>

          <div>
            <label htmlFor="startKm" className="block text-sm font-medium mb-1">
              Počáteční stav km *
            </label>
            <input
              type="number"
              name="startKm"
              id="startKm"
              required
              min="0"
              step="0.1"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0.0"
            />
          </div>
          
          <div>
            <label htmlFor="endKm" className="block text-sm font-medium mb-1">
              Konečný stav km *
            </label>
            <input
              type="number"
              name="endKm"
              id="endKm"
              required
              min="0"
              step="0.1"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0.0"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium mb-1">
            Účel cesty
          </label>
          <input
            type="text"
            name="purpose"
            id="purpose"
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Schůzka s klientem..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Uložit jízdu
          </button>
        </div>
      </form>
    </div>
  );
}
