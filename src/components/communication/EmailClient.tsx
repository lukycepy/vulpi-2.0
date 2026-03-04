"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, RefreshCw, Mail, Search, Trash2, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, fetchEmails } from "@/actions/email";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export function EmailClient() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  
  // Compose state
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  const { toast } = useToast();

  const loadEmails = async () => {
    setLoading(true);
    try {
      const result = await fetchEmails("INBOX");
      setEmails(result.emails);
    } catch (error: any) {
      toast({ 
        title: "Chyba načítání emailů", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox") {
      loadEmails();
    }
  }, [activeTab]);

  const handleSend = async () => {
    if (!to || !subject || !message) {
      toast({ title: "Chyba", description: "Vyplňte všechna pole", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      await sendEmail({ to, subject, text: message });
      toast({ title: "Odesláno", description: "Email byl úspěšně odeslán." });
      setTo("");
      setSubject("");
      setMessage("");
      setActiveTab("inbox");
    } catch (error: any) {
      toast({ title: "Chyba odesílání", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar / List */}
      <div className="col-span-4 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Doručená pošta</h2>
          <Button variant="ghost" size="icon" onClick={loadEmails} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Hledat..." className="pl-8" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="inbox" className="flex-1">Doručené</TabsTrigger>
            <TabsTrigger value="compose" className="flex-1">Nová zpráva</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="flex-1 border rounded-md bg-card">
          {activeTab === "inbox" && (
            <div className="flex flex-col">
              {emails.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Žádné zprávy
                </div>
              ) : (
                emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`flex flex-col items-start gap-1 p-4 border-b hover:bg-accent text-left transition-colors ${
                      selectedEmail?.id === email.id ? "bg-accent" : ""
                    } ${!email.read ? "font-semibold" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium truncate">{email.from}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(email.date), { addSuffix: true, locale: cs })}
                      </span>
                    </div>
                    <span className="text-sm truncate w-full">{email.subject}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {email.snippet}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="col-span-8 h-full">
        {activeTab === "compose" ? (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Nová zpráva</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <div className="grid gap-2">
                <Input 
                  placeholder="Komu (email)" 
                  value={to} 
                  onChange={(e) => setTo(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Input 
                  placeholder="Předmět" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                />
              </div>
              <Textarea 
                placeholder="Text zprávy..." 
                className="flex-1 resize-none" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Odesílám...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Odeslat
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedEmail ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b py-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedEmail.from}</span>
                    <span>•</span>
                    <span>{new Date(selectedEmail.date).toLocaleString('cs-CZ')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" title="Odpovědět">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Smazat">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-6">
              <div className="whitespace-pre-wrap text-sm">
                {selectedEmail.snippet} 
                {/* Real body would go here */}
                {`\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground border rounded-md bg-muted/10">
            <Mail className="h-12 w-12 mb-4 opacity-20" />
            <p>Vyberte zprávu pro zobrazení</p>
          </div>
        )}
      </div>
    </div>
  );
}