
"use client";

import { useState } from "react";
import { sendBulkNewsletter } from "@/actions/marketing";

export function NewsletterForm({ clients }: { clients: any[] }) {
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; failed?: number } | null>(null);

  const handleSelectAll = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  const handleToggleClient = (id: string) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter(cid => cid !== id));
    } else {
      setSelectedClientIds([...selectedClientIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      alert("Vyberte alespoň jednoho klienta.");
      return;
    }

    setIsSending(true);
    setResult(null);

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("body", body);
    formData.append("clientIds", JSON.stringify(selectedClientIds));

    try {
      const res = await sendBulkNewsletter(formData);
      setResult(res);
      if (res.success) {
        setSubject("");
        setBody("");
        setSelectedClientIds([]);
        alert(`Odesláno: ${res.sent}, Chyby: ${res.failed}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Chyba při odesílání: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Client Selection */}
      <div className="md:col-span-1 border rounded-lg p-4 bg-card h-fit">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Klienti ({selectedClientIds.length})</h3>
          <button 
            type="button" 
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline"
          >
            {selectedClientIds.length === clients.length ? "Zrušit výběr" : "Vybrat vše"}
          </button>
        </div>
        
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {clients.map(client => (
            <div key={client.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`client-${client.id}`}
                checked={selectedClientIds.includes(client.id)}
                onChange={() => handleToggleClient(client.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor={`client-${client.id}`} className="text-sm cursor-pointer truncate">
                {client.name}
              </label>
            </div>
          ))}
          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground">Žádní klienti k dispozici.</p>
          )}
        </div>
      </div>

      {/* Email Composer */}
      <div className="md:col-span-2 border rounded-lg p-6 bg-card">
        {result && (
          <div className={`mb-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.success 
              ? `Odesláno: ${result.sent}, Chyby: ${result.failed}` 
              : "Chyba při odesílání"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Předmět</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full h-10 rounded-md border border-input px-3 py-2 text-sm bg-background"
              placeholder="Novinky ve Vulpi..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Text zprávy</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={12}
              className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
              placeholder="Vážený kliente {{clientName}}, ..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dostupné proměnné: <code>{"{{clientName}}"}</code>. Odkazy budou automaticky trackovány.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || selectedClientIds.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isSending ? "Odesílání..." : "Odeslat Newsletter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
