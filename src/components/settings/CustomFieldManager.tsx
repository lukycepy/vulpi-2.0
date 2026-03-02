"use client";

import { useState } from "react";
import { CustomFieldDefinition } from "@prisma/client";
import { createCustomFieldDefinition, updateCustomFieldDefinition, deleteCustomFieldDefinition } from "@/actions/custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomFieldManagerProps {
  initialFields: CustomFieldDefinition[];
  organizationId: string;
  targetModel?: "INVOICE" | "CLIENT" | "PROJECT";
}

export function CustomFieldManager({ initialFields, organizationId, targetModel = "INVOICE" }: CustomFieldManagerProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>(initialFields);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    type: "TEXT",
    description: "",
  });

  const resetForm = () => {
    setFormData({ name: "", key: "", type: "TEXT", description: "" });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.key) {
      toast({ title: "Chyba", description: "Název a klíč jsou povinné.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await createCustomFieldDefinition({
        organizationId,
        targetModel,
        ...formData,
        type: formData.type as "TEXT" | "NUMBER" | "DATE" | "BOOLEAN",
      });
      toast({ title: "Úspěch", description: "Vlastní pole bylo vytvořeno." });
      router.refresh();
      resetForm();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message || "Nepodařilo se vytvořit pole.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name) {
      toast({ title: "Chyba", description: "Název je povinný.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await updateCustomFieldDefinition(id, {
        name: formData.name,
        description: formData.description,
      });
      toast({ title: "Úspěch", description: "Vlastní pole bylo aktualizováno." });
      router.refresh();
      resetForm();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message || "Nepodařilo se aktualizovat pole.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Opravdu chcete smazat toto pole? Data u faktur budou ztracena.")) return;

    setLoading(true);
    try {
      await deleteCustomFieldDefinition(id);
      toast({ title: "Úspěch", description: "Vlastní pole bylo smazáno." });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message || "Nepodařilo se smazat pole.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (field: CustomFieldDefinition) => {
    setFormData({
      name: field.name,
      key: field.key,
      type: field.type,
      description: field.description || "",
    });
    setEditingId(field.id);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Vlastní pole</h2>
        <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ name: "", key: "", type: "TEXT", description: "" }); }} disabled={isCreating || editingId !== null}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat pole
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>{editingId ? "Upravit pole" : "Nové vlastní pole"}</CardTitle>
            <CardDescription>
              {editingId ? "Upravte název a popis pole. Typ a klíč nelze měnit." : "Definujte nové pole pro vaše faktury."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Název pole</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Např. Číslo projektu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Klíč (pro API/Export)</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="project_id"
                    disabled={!!editingId}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Typ dat</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    disabled={!!editingId}
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Číslo</option>
                    <option value="DATE">Datum</option>
                    <option value="BOOLEAN">Ano/Ne</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Popis (volitelné)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Interní poznámka"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={resetForm} disabled={loading}>
                  <X className="mr-2 h-4 w-4" />
                  Zrušit
                </Button>
                <Button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()} disabled={loading}>
                  {loading ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Uložit změny" : "Vytvořit pole"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium">
            <tr>
              <th className="p-4">Název</th>
              <th className="p-4">Klíč</th>
              <th className="p-4">Typ</th>
              <th className="p-4">Popis</th>
              <th className="p-4 text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {initialFields.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Zatím jste nevytvořili žádná vlastní pole.
                </td>
              </tr>
            ) : (
              initialFields.map((field) => (
                <tr key={field.id} className="border-t hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{field.name}</td>
                  <td className="p-4 font-mono text-xs">{field.key}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {field.type}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{field.description || "-"}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(field)} disabled={loading}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(field.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
