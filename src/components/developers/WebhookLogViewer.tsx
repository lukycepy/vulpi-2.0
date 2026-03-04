"use client";

import { useState, useEffect } from "react";
import { WebhookLog } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getWebhookLogs } from "@/actions/developer";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebhookLogViewerProps {
  webhookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookLogViewer({ webhookId, open, onOpenChange }: WebhookLogViewerProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open && webhookId) {
      setLoading(true);
      getWebhookLogs(webhookId)
        .then(setLogs)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, webhookId]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historie webhooků</DialogTitle>
          <DialogDescription>
            Posledních 50 odeslaných požadavků.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden min-h-0 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>Žádné záznamy v historii.</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-4 space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-md">
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center gap-4 w-full p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    {expandedId === log.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    
                    <Badge 
                      variant={log.responseStatusCode >= 200 && log.responseStatusCode < 300 ? "default" : "destructive"}
                      className={log.responseStatusCode >= 200 && log.responseStatusCode < 300 ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {log.responseStatusCode}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "d. M. yyyy HH:mm:ss", { locale: cs })}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                       {(() => {
                         try {
                           return JSON.parse(log.requestPayload).event;
                         } catch (e) {
                           return "Unknown Event";
                         }
                       })()}
                    </span>
                  </button>
                  
                  {expandedId === log.id && (
                    <div className="p-4 pt-0 border-t bg-muted/10">
                      <div className="grid gap-4 mt-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Request Payload</h4>
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px]">
                            {JSON.stringify(JSON.parse(log.requestPayload), null, 2)}
                          </pre>
                        </div>
                        {log.responseBody && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Response Body</h4>
                            <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px]">
                              {log.responseBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
