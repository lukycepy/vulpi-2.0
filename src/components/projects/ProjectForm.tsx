"use client";

import { createProject } from "@/actions/projects";
import { useState } from "react";
import { Plus } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

export default function ProjectForm({ clients }: { clients: Client[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nový projekt
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Vytvořit nový projekt</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createProject} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Název projektu *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Např. Redesign webu"
            />
          </div>
          
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-1">
              Klient
            </label>
            <select
              name="clientId"
              id="clientId"
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">-- Vyberte klienta --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium mb-1">
              Hodinová sazba (Kč)
            </label>
            <input
              type="number"
              name="hourlyRate"
              id="hourlyRate"
              step="0.01"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-1">
              Rozpočet (Kč)
            </label>
            <input
              type="number"
              name="budget"
              id="budget"
              step="0.01"
              className="w-full p-2 border rounded-md bg-background"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium mb-1">
              Barva štítku
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="color"
                id="color"
                defaultValue="#3b82f6"
                className="h-10 w-20 p-1 border rounded-md bg-background cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">Pro rychlou identifikaci</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Popis
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Detailní popis projektu..."
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Vytvořit projekt
          </button>
        </div>
      </form>
    </div>
  );
}
