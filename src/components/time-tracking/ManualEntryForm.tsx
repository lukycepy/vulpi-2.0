"use client";

import { createManualTimeEntry } from "@/actions/time-tracking";
import { useState } from "react";
import { Clock, Plus } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export default function ManualEntryForm({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Manuální zadání
      </button>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Zpětné zadání času
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          Zavřít
        </button>
      </div>
      
      <form action={createManualTimeEntry} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Popis činnosti *
            </label>
            <input
              type="text"
              name="description"
              id="description"
              required
              className="w-full p-2 border rounded-md bg-background"
              placeholder="Co jste dělali?"
            />
          </div>
          
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium mb-1">
              Projekt
            </label>
            <select
              name="projectId"
              id="projectId"
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">-- Bez projektu --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium mb-1">
              Začátek *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              id="startTime"
              required
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium mb-1">
              Konec *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              id="endTime"
              required
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Uložit záznam
          </button>
        </div>
      </form>
    </div>
  );
}
