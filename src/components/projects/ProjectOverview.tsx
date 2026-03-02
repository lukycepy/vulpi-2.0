
import { Project, Task, TimeEntry, Invoice, Expense } from "@prisma/client";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, PiggyBank, FileText, CheckSquare } from "lucide-react";

interface ProjectOverviewProps {
  project: Project & {
    tasks: Task[];
    timeEntries: TimeEntry[];
    invoices: Invoice[];
    expenses: Expense[];
  };
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  // Calculate total time
  const totalTimeSeconds = project.timeEntries.reduce((sum, entry) => {
    let duration = entry.duration || 0;
    if (!duration && entry.endTime) {
      duration = Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000);
    }
    return sum + duration;
  }, 0);
  const totalHours = totalTimeSeconds / 3600;

  // Calculate task progress
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === "DONE").length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate revenue
  const revenue = project.invoices
    .filter(inv => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Odpracovaný čas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)} h</div>
          <p className="text-xs text-muted-foreground">
            {project.timeEntries.length} záznamů
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Úkoly</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks} / {totalTasks}</div>
          <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rozpočet</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {project.budget ? formatCurrency(project.budget) : "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fakturováno</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
          <p className="text-xs text-muted-foreground">
            Zaplacené faktury
          </p>
        </CardContent>
      </Card>
      
      <div className="col-span-full">
         <Card>
            <CardHeader>
                <CardTitle>Popis projektu</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.description || "Žádný popis."}
                </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
