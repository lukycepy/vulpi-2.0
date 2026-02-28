import { prisma } from "@/lib/prisma";
import ManualEntryForm from "@/components/time-tracking/ManualEntryForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { getTimeEntries, getUserProjects } from "@/services/time-tracking";
import { Briefcase, Calendar, Clock, Download } from "lucide-react";

export const metadata = {
  title: "Měření času | Vulpi",
  description: "Sledování času a vykazování práce",
};

export default async function TimeTrackingPage() {
  const user = await prisma.user.findFirst();
  
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Uživatel nenalezen.
        </div>
      </div>
    );
  }

  const projects = await getUserProjects(user.id);
  const entries = await getTimeEntries(user.id);

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = formatDate(entry.startTime);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Měření času</h1>
          <p className="text-muted-foreground mt-2">
            Přehled odpracovaného času a manuální zadávání.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export placeholder */}
          <button className="flex items-center gap-2 bg-outline border px-4 py-2 rounded-md hover:bg-muted transition-colors text-sm">
            <Download className="h-4 w-4" />
            Exportovat výkaz (PDF)
          </button>
        </div>
      </div>

      <ManualEntryForm projects={projects} />

      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historie záznamů
        </h2>

        {Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Žádné záznamy</h3>
            <p className="text-muted-foreground mt-1">
              Začněte měřit čas pomocí stopek v záhlaví nebo přidejte záznam manuálně.
            </p>
          </div>
        ) : (
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date} className="bg-card border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-3 border-b flex justify-between items-center">
                <span className="font-medium">{date}</span>
                <span className="text-sm text-muted-foreground">
                  Celkem: {(dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 3600).toFixed(2)} h
                </span>
              </div>
              <div className="divide-y">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{entry.description}</p>
                      {entry.project && (
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: entry.project.color || "#ccc" }} 
                          />
                          <span className="text-sm text-muted-foreground">{entry.project.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-medium text-base">
                          {new Date(entry.duration! * 1000).toISOString().substr(11, 8)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {entry.endTime ? new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                        </span>
                      </div>
                      
                      {entry.project?.hourlyRate && (
                        <div className="text-right min-w-[80px]">
                          <span className="font-medium text-green-600">
                            {formatCurrency((entry.duration! / 3600) * entry.project.hourlyRate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
