"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Key, Copy, Check, MoreVertical, Plus, Loader2, AlertTriangle } from "lucide-react";
import { deleteApiKey, createApiKey } from "@/actions/developer";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyManagerProps {
  initialApiKeys: ApiKey[];
}

export function ApiKeyManager({ initialApiKeys }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const { toast } = useToast();
  const router = useRouter();
  
  // Create Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  
  // Success Dialog State
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id);
      setApiKeys(apiKeys.filter((k) => k.id !== id));
      toast({
        title: "Klíč smazán",
        description: "API klíč byl úspěšně odstraněn a již nebude fungovat.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat API klíč.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setCreating(true);
    try {
      const rawKey = await createApiKey(newKeyName);
      setCreatedKey(rawKey);
      setCreateOpen(false);
      setSuccessOpen(true);
      setNewKeyName("");
      router.refresh(); // Refresh to update the list
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit API klíč.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Zkopírováno",
        description: "API klíč byl zkopírován do schránky.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nový API klíč
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Vytvořit nový API klíč</DialogTitle>
                <DialogDescription>
                  Zadejte název pro identifikaci tohoto klíče (např. &quot;Produkční server&quot;, &quot;Mobilní aplikace&quot;).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Název klíče</Label>
                  <Input
                    id="name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Např. Integrace E-shop"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vygenerovat klíč
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API klíč vytvořen</DialogTitle>
            <DialogDescription className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Tento klíč se zobrazí pouze jednou! Pečlivě si jej uložte.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                API Key
              </Label>
              <Input
                id="link"
                defaultValue={createdKey || ""}
                readOnly
                className="font-mono text-sm bg-muted"
              />
            </div>
            <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSuccessOpen(false)}
            >
              Zavřít
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/10">
            <Key className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Žádné API klíče</h3>
            <p className="text-muted-foreground mb-4">
              Zatím jste nevytvořili žádné API klíče.
            </p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">
                      {key.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded border">
                        {key.keyPrefix}
                      </span>
                      <span className="text-xs text-muted-foreground">
                         • Vytvořeno {format(new Date(key.createdAt), "d. M. yyyy", { locale: cs })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Poslední použití</p>
                      <p className="text-sm font-medium">
                        {key.lastUsedAt 
                          ? format(new Date(key.lastUsedAt), "d. M. yyyy HH:mm", { locale: cs }) 
                          : "Nikdy"}
                      </p>
                   </div>
                   
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(key.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Odvolat klíč
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
