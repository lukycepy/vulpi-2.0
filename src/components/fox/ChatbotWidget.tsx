"use client";

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { askFoxAssistant } from "@/actions/ai";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Ahoj! Jsem Liška Vulpi 🦊. S čím potřebuješ poradit?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputValue;
    if (!textToSend.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInputValue("");
    setIsLoading(true);
    
    try {
        // Send history excluding the last message which is what we are sending now, 
        // and filtering out the initial greeting if it's from bot
        const historyToSend = messages.slice(1).map(m => ({
            role: m.role,
            text: m.text
        }));

        const response = await askFoxAssistant(textToSend, historyToSend);
        setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'bot', text: "Promiň, něco se pokazilo. Zkus to prosím znovu. 🦊" }]);
    } finally {
        setIsLoading(false);
    }
  };

  const FAQ = [
    { q: "Jak vystavit fakturu?", a: "Přejděte do sekce Faktury a klikněte na 'Nová faktura'. Vyplňte formulář a uložte." },
    { q: "Jak napojit banku?", a: "V sekci Banka klikněte na 'Napojit účet' a zadejte API token vaší banky." },
    { q: "Jak přidat uživatele?", a: "V Nastavení -> Uživatelé můžete pozvat nové členy týmu." },
    { q: "Jak vyřešit reklamaci?", a: "V sekci Reklamace můžete reagovat na zprávy klientů a měnit stav reklamace." }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden">
      {isOpen && (
        <Card className="w-80 sm:w-96 mb-4 shadow-2xl border-orange-200 animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col h-[500px]">
          <CardHeader className="bg-orange-600 text-white p-4 rounded-t-lg flex flex-row justify-between items-center shrink-0">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <span className="text-xl">🦊</span> Vulpi Asistent
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-orange-700 hover:text-white" onClick={toggleChat}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden bg-slate-50 relative flex flex-col">
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="flex flex-col gap-3">
                    {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                        "p-3 rounded-lg max-w-[85%] text-sm shadow-sm",
                        msg.role === 'user' 
                            ? "bg-orange-100 self-end text-orange-900 rounded-br-none" 
                            : "bg-white self-start text-gray-800 border border-gray-100 rounded-bl-none"
                    )}>
                        {msg.text}
                    </div>
                    ))}
                    {isLoading && (
                        <div className="bg-white self-start text-gray-800 border border-gray-100 rounded-bl-none p-3 rounded-lg shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none h-12" />
          </CardContent>
          <div className="p-2 bg-white border-t space-y-2 shrink-0">
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide px-2">
                  {FAQ.map((item, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm" 
                      className="whitespace-nowrap text-xs h-7 px-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                      onClick={() => handleSend(item.q)}
                    >
                      {item.q}
                    </Button>
                  ))}
              </div>
              <div className="flex gap-2 px-2 pb-2">
                  <Input 
                    placeholder="Napište zprávu..." 
                    className="h-9 text-sm focus-visible:ring-orange-500"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                  />
                  <Button size="icon" className="h-9 w-9 bg-orange-600 hover:bg-orange-700" onClick={() => handleSend()} disabled={isLoading}>
                      <Send className="h-4 w-4" />
                  </Button>
              </div>
          </div>
        </Card>
      )}
      
      <Button 
        onClick={toggleChat}
        className={cn(
            "h-14 w-14 rounded-full shadow-xl p-0 flex items-center justify-center transition-all duration-300",
            isOpen ? "bg-gray-800 hover:bg-gray-900 rotate-90 scale-90" : "bg-orange-600 hover:bg-orange-700 hover:scale-110"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <span className="text-3xl">🦊</span>}
      </Button>
    </div>
  );
}
