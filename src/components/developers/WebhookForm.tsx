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
import { Checkbox } from "@/components/ui/checkbox";
import { createWebhook } from "@/actions/developer";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const AVAILABLE_EVENTS = [
  { id: "INVOICE_PAID", label: "Faktura zaplacena" },
  { id: "INVOICE_CREATED", label: "Faktura vytvořena" },
  { id: "INVOICE_OVERDUE", label: "Faktura po splatnosti" },
];

export function WebhookForm() {
  const [open, setOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    if (selectedEvents.length === 0) {
      toast({
        title: "Chyba",
        description: "Vyberte alespoň jednu událost.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createWebhook({ targetUrl, eventTypes: selectedEvents });
      toast({
        title: "Webhook vytvořen",
        description: "Nový webhook byl úspěšně přidán.",
      });
      setOpen(false);
      setTargetUrl("");
      setSelectedEvents([]);
      router.refresh();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nový Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Přidat nový webhook</DialogTitle>
            <DialogDescription>
              Zadejte URL adresu, na kterou budeme posílat notifikace o vybraných událostech.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Cílová URL</Label>
              <Input
                id="url"
                placeholder="https://api.vasedomena.cz/webhook"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                type="url"
              />
            </div>
            <div className="grid gap-2">
              <Label>Události</Label>
              <div className="grid gap-2 border rounded-md p-4">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <Label
                      htmlFor={event.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vytvořit webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
