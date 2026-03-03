
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { submitInventoryCheck } from "@/actions/inventory";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  unit: string;
}

interface InventoryCheckDialogProps {
  organizationId: string;
  products: Product[];
}

export function InventoryCheckDialog({ organizationId, products }: InventoryCheckDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State to hold actual quantities. Key is productId.
  // We initialize with empty values or current values? Prompt says "empty input".
  const [actualQuantities, setActualQuantities] = useState<Record<string, string>>({});

  const handleQuantityChange = (productId: string, value: string) => {
    setActualQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Filter only filled inputs
      const itemsToSubmit = Object.entries(actualQuantities)
        .filter(([_, value]) => value !== "")
        .map(([productId, value]) => ({
          productId,
          actualQuantity: parseFloat(value.replace(",", "."))
        }))
        .filter(item => !isNaN(item.actualQuantity));

      if (itemsToSubmit.length === 0) {
        toast({
          title: "Žádné změny",
          description: "Nebyly zadány žádné hodnoty.",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      await submitInventoryCheck(organizationId, itemsToSubmit);

      toast({
        title: "Inventura dokončena",
        description: `Aktualizováno ${itemsToSubmit.length} produktů.`,
        variant: "default",
      });
      
      setOpen(false);
      setActualQuantities({});
      
    } catch (error: any) {
      toast({
        title: "Chyba při ukládání",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Zahájit inventuru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Fyzická inventura skladu</DialogTitle>
          <DialogDescription>
            Zadejte skutečné fyzické stavy produktů. Systém automaticky vytvoří korekční pohyby (přebytek/manko).
            Nevyplněné položky zůstanou beze změny.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produkt</TableHead>
                <TableHead className="text-right">Účetní stav</TableHead>
                <TableHead className="text-right w-[200px]">Fyzický stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">
                    {product.stockQuantity} {product.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={product.stockQuantity.toString()}
                        className="w-32 text-right"
                        value={actualQuantities[product.id] || ""}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground w-8 text-left">
                        {product.unit}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Uložit inventuru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
