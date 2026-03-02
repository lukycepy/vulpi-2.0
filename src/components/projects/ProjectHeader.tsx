
import { Project } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface ProjectHeaderProps {
  project: Project & { client: any };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <Badge variant={
            project.status === "ACTIVE" ? "default" : 
            project.status === "COMPLETED" ? "secondary" : "outline"
          }>
            {project.status === "ACTIVE" ? "Aktivní" : 
             project.status === "COMPLETED" ? "Dokončeno" : "Archiv"}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {project.client && (
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>{project.client.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Vytvořeno {format(project.createdAt, "d. MMMM yyyy", { locale: cs })}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" /> Upravit
        </Button>
      </div>
    </div>
  );
}
