"use client";

import { createDispute } from "@/actions/portal";
import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";

export default function DisputeForm({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createDispute(invoiceId, message);
    setResult(res);
    setLoading(false);
    if (res.success) {
      setTimeout(() => {
        setOpen(false);
        setResult(null);
        setMessage("");
      }, 2000);
    }
  }

  if (!open) {
    return (
      <button 
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:text-red-700 underline flex items-center gap-1 mt-2"
      >
        <AlertTriangle className="h-4 w-4" />
        Rozporovat fakturu
      </button>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30 mt-4">
      <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">Rozporovat fakturu</h3>
      {result ? (
        <div className={`text-sm ${result.success ? "text-green-600" : "text-red-600"} mb-2`}>
          {result.message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Popište důvod reklamace..."
            className="w-full p-2 text-sm border border-red-200 rounded-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            rows={3}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Odesílám..." : (
                <>
                  <Send className="h-3 w-3" />
                  Odeslat
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
