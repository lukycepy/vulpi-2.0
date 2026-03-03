
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { rejectDocument } from "@/actions/approvals";
import { useToast } from "@/hooks/use-toast";
import { Loader2, XCircle } from "lucide-react";

interface RejectDialogProps {
  approvalId: string;
}

export function RejectDialog({ approvalId }: RejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const handleReject = async () => {
    if (!note) {
      toast({ title: "Chyba", description: "Zadejte důvod zamítnutí.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await rejectDocument(approvalId, note);
      toast({ title: "Zamítnuto", description: "Faktura byla vrácena do stavu koncept." });
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <XCircle className="h-4 w-4" />
          Zamítnout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zamítnout fakturu</DialogTitle>
          <DialogDescription>
            Uveďte důvod zamítnutí. Faktura se vrátí do stavu koncept (DRAFT) a žadatel bude informován.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          <Label htmlFor="note">Důvod zamítnutí</Label>
          <Textarea 
            id="note" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Např. Špatná částka, chybí IČO..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Zrušit
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Potvrdit zamítnutí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
