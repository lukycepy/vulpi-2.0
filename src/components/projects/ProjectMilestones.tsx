"use client";

import { useState } from "react";
import { Project, ProjectMilestone } from "@prisma/client";
import { createMilestone, billMilestone, updateMilestone, deleteMilestone, toggleMilestoneCompletion } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import { Plus, FileText, CheckCircle, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProjectMilestonesProps {
  project: Project & { milestones: ProjectMilestone[] };
}

export function ProjectMilestones({ project }: ProjectMilestonesProps) {
  const { toast } = useToast();
  // Create State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  
  // Edit State
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [billingId, setBillingId] = useState<string | null>(null);
  
  const router = useRouter();

  const handleCreate = async () => {
    if (!name || !amount) return;
    setIsLoading(true);
    try {
      await createMilestone(project.id, {
        name,
        amount: parseFloat(amount)
      });
      toast({ title: "Milník vytvořen" });
      setIsDialogOpen(false);
      setName("");
      setAmount("");
      router.refresh();
    } catch (error) {
      toast({ title: "Chyba při vytváření milníku", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (milestone: ProjectMilestone) => {
    setEditingMilestone(milestone);
    setEditName(milestone.title);
    setEditAmount(milestone.amount.toString());
  };

  const handleUpdate = async () => {
    if (!editingMilestone || !editName || !editAmount) return;
    setIsLoading(true);
    try {
      await updateMilestone(editingMilestone.id, {
        name: editName,
        amount: parseFloat(editAmount)
      });
      toast({ title: "Milník upraven" });
      setEditingMilestone(null);
      router.refresh();
    } catch (error) {
      toast({ title: "Chyba při úpravě milníku", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tento milník?")) return;
    try {
      await deleteMilestone(id);
      toast({ title: "Milník smazán" });
      router.refresh();
    } catch (error) {
      toast({ title: "Nelze smazat milník (možná je již vyfakturován)", variant: "destructive" });
    }
  };

  const handleToggleCompletion = async (id: string, isCompleted: boolean) => {
    try {
      await toggleMilestoneCompletion(id, isCompleted);
      toast({ title: isCompleted ? "Milník označen jako hotový" : "Milník označen jako nehotový" });
      router.refresh();
    } catch (error) {
      toast({ title: "Chyba při změně stavu milníku", variant: "destructive" });
    }
  };

  const handleBill = async (id: string) => {
    setBillingId(id);
    try {
      const result = await billMilestone(id);
      toast({ title: "Faktura vytvořena (Draft)" });
      router.refresh();
      // Optionally redirect to invoice
      router.push(`/invoices/${result.invoiceId}/edit`);
    } catch (error) {
      toast({ title: "Chyba při fakturaci", variant: "destructive" });
      console.error(error);
    } finally {
      setBillingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fakturační milníky</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nový milník
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nový milník</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Název</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Např. Dokončení 1. fáze"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Částka (bez DPH)</label>
                <Input 
                  type="number"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Zrušit</Button>
              <Button onClick={handleCreate} disabled={isLoading || !name || !amount}>
                {isLoading ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upravit milník</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Název</label>
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  placeholder="Např. Dokončení 1. fáze"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Částka (bez DPH)</label>
                <Input 
                  type="number"
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMilestone(null)}>Zrušit</Button>
              <Button onClick={handleUpdate} disabled={isLoading || !editName || !editAmount}>
                {isLoading ? "Ukládám..." : "Uložit změny"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Hotovo</TableHead>
              <TableHead>Název</TableHead>
              <TableHead className="text-right">Částka</TableHead>
              <TableHead className="text-center">Stav</TableHead>
              <TableHead className="text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.milestones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Zatím žádné milníky.
                </TableCell>
              </TableRow>
            ) : (
              project.milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell>
                    <Checkbox 
                        checked={milestone.isCompleted} 
                        onCheckedChange={(checked) => handleToggleCompletion(milestone.id, checked as boolean)}
                        disabled={milestone.isBilled}
                    />
                  </TableCell>
                  <TableCell className={milestone.isCompleted ? "line-through text-muted-foreground font-medium" : "font-medium"}>
                    {milestone.title}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(milestone.amount)}</TableCell>
                  <TableCell className="text-center">
                    {milestone.isBilled ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" /> Vyfakturováno
                      </Badge>
                    ) : milestone.isCompleted ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Dokončeno
                        </Badge>
                    ) : (
                      <Badge variant="outline">K realizaci</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {!milestone.isBilled && (
                        <Button 
                          size="sm" 
                          variant={milestone.isCompleted ? "default" : "secondary"}
                          onClick={() => handleBill(milestone.id)}
                          disabled={!!billingId || !milestone.isCompleted}
                          title={!milestone.isCompleted ? "Nejdříve označte milník jako hotový" : ""}
                        >
                          {billingId === milestone.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                              <>
                                  <FileText className="h-4 w-4 mr-2" /> Vyfakturovat
                              </>
                          )}
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(milestone)} disabled={milestone.isBilled}>
                            <Pencil className="mr-2 h-4 w-4" /> Upravit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(milestone.id)} disabled={milestone.isBilled}>
                            <Trash2 className="mr-2 h-4 w-4" /> Smazat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
