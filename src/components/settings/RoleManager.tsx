"use client";

import { useState } from "react";
import { RoleDefinition } from "@prisma/client";
import { createRole, updateRole, deleteRole, cloneRole } from "@/actions/roles";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Copy, Plus, Shield } from "lucide-react";

interface RoleManagerProps {
  initialRoles: RoleDefinition[];
  organizationId: string;
}

export function RoleManager({ initialRoles, organizationId }: RoleManagerProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>(initialRoles);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleOpenCreate = () => {
    setEditingRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedPermissions([]);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: RoleDefinition) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || "");
    try {
      setSelectedPermissions(JSON.parse(role.permissions));
    } catch {
      setSelectedPermissions([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        // Update
        const updated = await updateRole(editingRole.id, {
          name: newRoleName,
          description: newRoleDescription,
          permissions: selectedPermissions,
        });
        setRoles(roles.map(r => r.id === updated.id ? updated : r));
        toast({ title: "Role aktualizována", description: `Role ${updated.name} byla uložena.` });
      } else {
        // Create
        const created = await createRole({
          organizationId,
          name: newRoleName,
          description: newRoleDescription,
          permissions: selectedPermissions,
        });
        setRoles([...roles, created]);
        toast({ title: "Role vytvořena", description: `Nová role ${created.name} byla vytvořena.` });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se uložit roli.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tuto roli?")) return;
    try {
      await deleteRole(id);
      setRoles(roles.filter(r => r.id !== id));
      toast({ title: "Role smazána", description: "Role byla úspěšně odstraněna." });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se smazat roli.", variant: "destructive" });
    }
  };

  const handleClone = async (role: RoleDefinition) => {
    const newName = `${role.name} (Kopie)`;
    try {
      const cloned = await cloneRole(role.id, newName, organizationId);
      setRoles([...roles, cloned]);
      toast({ title: "Role zkopírována", description: `Vytvořena kopie role ${role.name}.` });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se zkopírovat roli.", variant: "destructive" });
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Správa rolí (RBAC)</h2>
          <p className="text-muted-foreground">Definujte vlastní role a oprávnění pro uživatele.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nová role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          let permissionsCount = 0;
          try {
            permissionsCount = JSON.parse(role.permissions).length;
          } catch {}

          return (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="line-clamp-1 h-5">{role.description}</CardDescription>
                  </div>
                  {role.isSystem && <Badge variant="secondary">Systémová</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Shield className="h-4 w-4" />
                  <span>{permissionsCount} oprávnění</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(role)}>
                    <Edit className="h-4 w-4 mr-1" /> Upravit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleClone(role)}>
                    <Copy className="h-4 w-4 mr-1" /> Klonovat
                  </Button>
                  {!role.isSystem && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(role.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Upravit roli" : "Nová role"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Název role</Label>
              <Input 
                id="name" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)} 
                placeholder="Např. Junior Účetní"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Popis</Label>
              <Input 
                id="description" 
                value={newRoleDescription} 
                onChange={(e) => setNewRoleDescription(e.target.value)} 
                placeholder="Krátký popis role"
              />
            </div>

            <div className="space-y-4 border rounded-md p-4 mt-2">
              <Label className="text-base">Oprávnění</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={perm.id} 
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor={perm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {perm.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Zrušit</Button>
            <Button onClick={handleSave}>Uložit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
