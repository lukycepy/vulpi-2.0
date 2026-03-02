import { prisma } from "@/lib/prisma";
import ProjectForm from "@/components/projects/ProjectForm";
import { formatCurrency } from "@/lib/format";
import { Briefcase, Clock, FileText, PiggyBank, TrendingUp } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export const metadata = {
  title: "Projekty | Vulpi",
  description: "Správa projektů a sledování ziskovosti",
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Nejste členem žádné organizace.
        </div>
      </div>
    );
  }
  
  const orgId = membership.organizationId;
  const canManageProjects = await hasPermission(user.id, orgId, "manage_projects");

  if (!canManageProjects) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu projektů.
        </div>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      client: true,
      timeEntries: true,
      invoices: true,
      expenses: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projekty</h1>
          <p className="text-muted-foreground mt-2">
            Správa projektů, sledování času a ziskovosti.
          </p>
        </div>
        <ProjectForm clients={clients} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Zatím nemáte žádné projekty</h3>
            <p className="text-muted-foreground mt-1">
              Vytvořte svůj první projekt pomocí tlačítka výše.
            </p>
          </div>
        ) : (
          projects.map((project: any) => {
            // Calculations
            const totalTimeSeconds = project.timeEntries.reduce((sum: number, entry: any) => {
              // Calculate duration if not present (for running timer, use current time - not ideal for static page but ok)
              // For simplicity, use stored duration or diff if endTime exists
              let duration = entry.duration || 0;
              if (!duration && entry.endTime) {
                duration = Math.floor((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000);
              }
              return sum + duration;
            }, 0);
            
            const totalHours = totalTimeSeconds / 3600;
            const estimatedValue = totalHours * (project.hourlyRate || 0);
            
            // Revenue from invoices
            const revenue = project.invoices
              .filter((inv: any) => inv.status === "PAID")
              .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
              
            // Expenses linked to project
            const expenses = project.expenses
              .reduce((sum: number, exp: any) => sum + exp.amount, 0);
              
            const profit = revenue - expenses;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return (
              <div key={project.id} className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-2 w-full" style={{ backgroundColor: project.color || "#000000" }} />
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg truncate" title={project.name}>
                        {project.name}
                      </h3>
                      {project.client && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {project.client.name}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      project.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" :
                      project.status === "COMPLETED" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}>
                      {project.status === "ACTIVE" ? "Aktivní" :
                       project.status === "COMPLETED" ? "Hotovo" : "Archiv"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                    {project.description || "Bez popisu"}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-2 border-t border-b text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Čas
                      </p>
                      <p className="font-medium">{totalHours.toFixed(1)} h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <PiggyBank className="h-3 w-3" /> Rozpočet
                      </p>
                      <p className="font-medium">
                        {project.budget ? formatCurrency(project.budget) : "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Fakturováno
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Ziskovost
                      </span>
                      <span className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(profit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
