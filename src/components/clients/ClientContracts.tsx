"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Plus, Trash2, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createContract, deleteContract } from "@/actions/contracts";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Contract {
  id: string;
  title: string;
  validFrom: Date | null;
  validUntil: Date | null;
  fileUrl: string | null;
  createdAt: Date;
}

interface ClientContractsProps {
  clientId: string;
  contracts: Contract[];
  isLegalHold?: boolean;
}

export function ClientContracts({ clientId, contracts, isLegalHold }: ClientContractsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    try {
      formData.append("clientId", clientId);
      await createContract(formData);
      toast({ title: "Úspěch", description: "Smlouva byla nahrána." });
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Chyba", description: "Chyba při nahrávání smlouvy." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Opravdu chcete smazat tuto smlouvu?")) return;
    
    try {
      await deleteContract(id);
      toast({ title: "Smlouva smazána." });
      router.refresh();
    } catch (error: any) {
      toast({ title: error.message || "Chyba při mazání.", variant: "destructive" });
    }
  }

  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return date > today && date < thirtyDaysFromNow;
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return date < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Smlouvy a NDA</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={isLegalHold} title={isLegalHold ? "Nelze přidávat smlouvy během Legal Hold" : ""}>
              <Plus className="h-4 w-4 mr-2" />
              Nahrát smlouvu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nahrát novou smlouvu</DialogTitle>
              <DialogDescription>
                Nahrajte PDF smlouvy a nastavte platnost.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Název smlouvy</Label>
                <Input id="title" name="title" required placeholder="Např. Rámcová smlouva 2024" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Platnost od</Label>
                  <Input id="validFrom" name="validFrom" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Platnost do</Label>
                  <Input id="validUntil" name="validUntil" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Soubor (PDF)</Label>
                <Input id="file" name="file" type="file" accept=".pdf" required />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Nahrávám..." : "Uložit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Žádné nahrané smlouvy.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Název</TableHead>
                <TableHead>Platnost od</TableHead>
                <TableHead>Platnost do</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        {contract.fileUrl ? (
                            <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {contract.title}
                            </a>
                        ) : (
                            contract.title
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.validFrom ? format(contract.validFrom, "d. M. yyyy", { locale: cs }) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {contract.validUntil ? format(contract.validUntil, "d. M. yyyy", { locale: cs }) : "Neurčitá"}
                        {isExpired(contract.validUntil) && (
                            <span className="text-red-500 text-xs font-bold px-2 py-0.5 bg-red-100 rounded-full">Expirovalo</span>
                        )}
                        {isExpiringSoon(contract.validUntil) && (
                            <span className="text-orange-500 text-xs font-bold px-2 py-0.5 bg-orange-100 rounded-full flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Končí brzy
                            </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isLegalHold ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled
                        title="Nelze smazat - aktivní Legal Hold"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
