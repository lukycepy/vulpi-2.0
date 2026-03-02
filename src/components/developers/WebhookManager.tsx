"use client";

import { useState } from "react";
import { Webhook } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, Activity, Copy, Check, MoreVertical } from "lucide-react";
import { WebhookForm } from "./WebhookForm";
import { WebhookLogViewer } from "./WebhookLogViewer";
import { deleteWebhook, toggleWebhook } from "@/actions/developer";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface WebhookWithCount extends Webhook {
  _count: {
    logs: number;
  };
}

interface WebhookManagerProps {
  initialWebhooks: WebhookWithCount[];
}

export function WebhookManager({ initialWebhooks }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookWithCount[]>(initialWebhooks);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast({
        title: "Webhook smazán",
        description: "Webhook byl úspěšně odstraněn.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat webhook.",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleWebhook(id, isActive);
      setWebhooks(
        webhooks.map((w) => (w.id === id ? { ...w, isActive } : w))
      );
      toast({
        title: isActive ? "Webhook aktivován" : "Webhook deaktivován",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit stav webhooku.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Zkopírováno",
      description: "Secret Key byl zkopírován do schránky.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <WebhookForm />
      </div>

      <div className="grid gap-4">
        {webhooks.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/10">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Žádné webhooky</h3>
            <p className="text-muted-foreground mb-4">
              Zatím jste nevytvořili žádné webhooky.
            </p>
            <WebhookForm />
          </div>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/5">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <span className="truncate max-w-[300px] md:max-w-[500px]" title={webhook.targetUrl}>
                      {webhook.targetUrl}
                    </span>
                    {webhook.isActive ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aktivní</Badge>
                    ) : (
                      <Badge variant="secondary">Neaktivní</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Vytvořeno {format(new Date(webhook.createdAt), "d. MMMM yyyy", { locale: cs })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={(checked) => handleToggle(webhook.id, checked)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(webhook.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Smazat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Události</span>
                    <div className="flex flex-wrap gap-1">
                      {webhook.eventTypes.split(",").map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Secret Key</span>
                    <div className="flex items-center gap-2">
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {webhook.secretKey ? `${webhook.secretKey.substring(0, 8)}...` : "Není"}
                      </code>
                      {webhook.secretKey && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(webhook.secretKey!, webhook.id)}
                        >
                          {copiedId === webhook.id ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Historie</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{webhook._count.logs} záznamů</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => setSelectedWebhookId(webhook.id)}
                      >
                        Zobrazit logy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedWebhookId && (
        <WebhookLogViewer
          webhookId={selectedWebhookId}
          open={!!selectedWebhookId}
          onOpenChange={(open) => !open && setSelectedWebhookId(null)}
        />
      )}
    </div>
  );
}
