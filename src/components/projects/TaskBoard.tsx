"use client";

import { useState, useEffect } from "react";
import { Project, Task, User } from "@prisma/client";
import { createTask, updateTaskStatus, updateTask, deleteTask } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, Calendar, User as UserIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface TaskBoardProps {
  project: Project & { tasks: (Task & { assignedTo: User | null })[] };
  users: User[];
}

export function TaskBoard({ project, users }: TaskBoardProps) {
  const { toast } = useToast();
  // Create Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string | undefined>(undefined);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<Task & { assignedTo: User | null } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssignee, setEditAssignee] = useState<string | undefined>(undefined);
  const [editDueDate, setEditDueDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  
  // Local state for tasks to handle optimistic updates
  const [tasks, setTasks] = useState(project.tasks);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setTasks(project.tasks);
  }, [project.tasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle) return;
    setIsLoading(true);
    try {
      await createTask(project.id, {
        title: newTaskTitle,
        description: newTaskDesc,
        assignedToUserId: newTaskAssignee,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined
      });
      toast({
        title: "Úkol vytvořen",
        description: "Úkol byl úspěšně přidán do projektu.",
      });
      setIsCreateOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskAssignee(undefined);
      setNewTaskDueDate("");
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba při vytváření úkolu",
        description: "Zkuste to prosím znovu.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (task: Task & { assignedTo: User | null }) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditAssignee(task.assignedToUserId || undefined);
    setEditDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTitle) return;
    setIsLoading(true);
    
    // Optimistic update
    const updatedTasks = tasks.map(t => 
      t.id === editingTask.id ? {
        ...t,
        title: editTitle,
        description: editDesc,
        assignedToUserId: editAssignee || null,
        assignedTo: users.find(u => u.id === editAssignee) || null,
        dueDate: editDueDate ? new Date(editDueDate) : null
      } : t
    );
    setTasks(updatedTasks);

    try {
      await updateTask(editingTask.id, {
        title: editTitle,
        description: editDesc,
        assignedToUserId: editAssignee,
        dueDate: editDueDate ? new Date(editDueDate) : undefined
      });
      toast({
        title: "Úkol upraven"
      });
      setEditingTask(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba při úpravě úkolu",
        variant: "destructive"
      });
      setTasks(project.tasks); // Revert
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Opravdu chcete smazat tento úkol?")) return;
    
    // Optimistic update
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);

    try {
      await deleteTask(taskId);
      toast({
        title: "Úkol smazán"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba při mazání úkolu",
        variant: "destructive"
      });
      setTasks(project.tasks); // Revert
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    
    // Optimistic update
    const updatedTasks = tasks.map(t => 
        t.id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await updateTaskStatus(draggableId, newStatus);
      toast({
        title: "Stav aktualizován",
        description: `Úkol přesunut do: ${columns.find(c => c.id === newStatus)?.title}`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba při změně stavu",
        variant: "destructive",
      });
      setTasks(project.tasks); // Revert
    }
  };

  const columns = [
    { id: "TODO", title: "Ke zpracování", color: "bg-gray-100" },
    { id: "IN_PROGRESS", title: "V řešení", color: "bg-blue-50" },
    { id: "DONE", title: "Hotovo", color: "bg-green-50" }
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Kanban nástěnka</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nový úkol
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový úkol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Název</label>
                <Input 
                  value={newTaskTitle} 
                  onChange={(e) => setNewTaskTitle(e.target.value)} 
                  placeholder="Co je potřeba udělat?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Popis</label>
                <Textarea 
                  value={newTaskDesc} 
                  onChange={(e) => setNewTaskDesc(e.target.value)} 
                  placeholder="Detaily úkolu..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Přiřadit</label>
                  <Select onValueChange={setNewTaskAssignee} value={newTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vybrat člena" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Termín</label>
                  <Input 
                    type="date" 
                    value={newTaskDueDate} 
                    onChange={(e) => setNewTaskDueDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Zrušit</Button>
              <Button onClick={handleCreateTask} disabled={isLoading || !newTaskTitle}>
                {isLoading ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upravit úkol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Název</label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  placeholder="Co je potřeba udělat?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Popis</label>
                <Textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  placeholder="Detaily úkolu..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Přiřadit</label>
                  <Select onValueChange={setEditAssignee} value={editAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vybrat člena" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Termín</label>
                  <Input 
                    type="date" 
                    value={editDueDate} 
                    onChange={(e) => setEditDueDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>Zrušit</Button>
              <Button onClick={handleUpdateTask} disabled={isLoading || !editTitle}>
                {isLoading ? "Ukládám..." : "Uložit změny"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-hidden">
            {columns.map(col => (
            <Droppable key={col.id} droppableId={col.id}>
                {(provided) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col h-full rounded-lg border ${col.color} p-4`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{col.title}</h3>
                            <span className="bg-white/50 text-xs px-2 py-1 rounded-full font-medium">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {tasks
                            .filter(task => task.status === col.id)
                            .map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={{
                                                ...provided.draggableProps.style,
                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                            }}
                                        >
                                            <Card className={`shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group ${snapshot.isDragging ? "rotate-2 shadow-lg ring-2 ring-primary/20" : ""}`}>
                                                <CardContent className="p-3 space-y-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-medium text-sm leading-snug line-clamp-2">{task.title}</h4>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                                                <Pencil className="mr-2 h-3 w-3" /> Upravit
                                                            </DropdownMenuItem>
                                                            
                                                            {/* Status Change Options - Fallback for DnD */}
                                                            {task.status !== "TODO" && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    // Manual status update
                                                                    const newStatus = "TODO";
                                                                    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
                                                                    setTasks(updatedTasks as any); // Cast to fix type if needed, but tasks is typed correctly
                                                                    updateTaskStatus(task.id, newStatus).catch(() => {
                                                                        toast({
                                                                            title: "Chyba při změně stavu",
                                                                            variant: "destructive",
                                                                        });
                                                                        setTasks(project.tasks);
                                                                    });
                                                                }}>
                                                                    <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                                                                    Přesunout do: Ke zpracování
                                                                </DropdownMenuItem>
                                                            )}
                                                            {task.status !== "IN_PROGRESS" && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    const newStatus = "IN_PROGRESS";
                                                                    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
                                                                    setTasks(updatedTasks as any);
                                                                    updateTaskStatus(task.id, newStatus).catch(() => {
                                                                        toast({
                                                                            title: "Chyba při změně stavu",
                                                                            variant: "destructive",
                                                                        });
                                                                        setTasks(project.tasks);
                                                                    });
                                                                }}>
                                                                    <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                                                                    Přesunout do: V řešení
                                                                </DropdownMenuItem>
                                                            )}
                                                            {task.status !== "DONE" && (
                                                                <DropdownMenuItem onClick={() => {
                                                                    const newStatus = "DONE";
                                                                    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
                                                                    setTasks(updatedTasks as any);
                                                                    updateTaskStatus(task.id, newStatus).catch(() => {
                                                                        toast({
                                                                            title: "Chyba při změně stavu",
                                                                            variant: "destructive",
                                                                        });
                                                                        setTasks(project.tasks);
                                                                    });
                                                                }}>
                                                                    <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                                                                    Přesunout do: Hotovo
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600 border-t mt-1" onClick={() => handleDeleteTask(task.id)}>
                                                                <Trash2 className="mr-2 h-3 w-3" /> Smazat
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between pt-2 border-t mt-1">
                                                    <div className="flex items-center gap-2">
                                                    {task.assignedTo ? (
                                                        <div className="flex items-center gap-1.5" title={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}>
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={task.assignedTo.avatarUrl || undefined} />
                                                                <AvatarFallback className="text-[9px]">
                                                                    {task.assignedTo.firstName?.[0]}{task.assignedTo.lastName?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                                                {task.assignedTo.firstName}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center" title="Nepřiřazeno">
                                                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    </div>

                                                    {task.dueDate && (
                                                        <div className={`flex items-center gap-1 text-[10px] ${
                                                            new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-red-500 font-medium" : "text-muted-foreground"
                                                        }`}>
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(task.dueDate), "d.M.", { locale: cs })}
                                                        </div>
                                                    )}
                                                </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
            ))}
        </div>
      </DragDropContext>
    </div>
  );
}
