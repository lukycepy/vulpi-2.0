
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { notFound, redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { TaskBoard } from "@/components/projects/TaskBoard";
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { ProjectProfitability } from "@/components/projects/ProjectProfitability";
import { ProjectOverview } from "@/components/projects/ProjectOverview";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }

  const orgId = membership.organizationId;
  const canViewProjects = await hasPermission(user.id, orgId, "view_projects");

  if (!canViewProjects) {
    return <div>Nemáte oprávnění prohlížet projekty.</div>;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: {
        include: {
          assignedTo: true
        }
      },
      milestones: true,
      expenses: true,
      invoices: true,
      timeEntries: {
        include: {
          user: true
        }
      }
    }
  });

  if (!project || project.organizationId !== orgId) {
    notFound();
  }

  const members = await prisma.membership.findMany({
    where: { organizationId: orgId },
    include: { user: true }
  });
  
  const users = members.map(m => m.user);
  
  const userRates = members.reduce((acc, m) => {
    acc[m.userId] = m.hourlyRate || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <ProjectHeader project={project} />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="tasks">Úkoly (Kanban)</TabsTrigger>
          <TabsTrigger value="milestones">Milníky</TabsTrigger>
          <TabsTrigger value="financials">Finance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
           <ProjectOverview project={project} />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
           <TaskBoard project={project} users={users} />
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
           <ProjectMilestones project={project} />
        </TabsContent>
        
        <TabsContent value="financials" className="space-y-4">
           <ProjectProfitability project={project} userRates={userRates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
