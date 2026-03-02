"use client";

import { useState } from "react";
import { X, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Ahoj! Jsem Liška Vulpi 🦊. S čím potřebuješ poradit?' }
  ]);
  const [inputValue, setInputValue] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  const handleQuestion = (question: string, answer: string) => {
    setMessages(prev => [
      ...prev, 
      { role: 'user', text: question },
      { role: 'bot', text: answer }
    ]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
    setInputValue("");
    
    // Simple echo/fallback for custom input
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: "Omlouvám se, na tuto konkrétní otázku zatím neznám odpověď. Zkuste prosím vybrat jednu z možností níže nebo kontaktujte podporu." }]);
    }, 1000);
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
                      onClick={() => handleQuestion(item.q, item.a)}
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
                  />
                  <Button size="icon" className="h-9 w-9 bg-orange-600 hover:bg-orange-700" onClick={handleSend}>
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
