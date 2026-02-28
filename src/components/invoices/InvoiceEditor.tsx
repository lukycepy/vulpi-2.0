"use client";

import { useState, useEffect } from "react";
import { createInvoice, updateInvoice, InvoiceItemData } from "@/actions/invoice";
import { useRouter } from "next/navigation";
import { useFoxConfetti } from "@/hooks/use-fox-confetti";
import { FoxSpinner } from "@/components/fox/FoxSpinner";
import { CustomFieldDefinition } from "@prisma/client";

// Simplified types for props
interface Client {
  id: string;
  name: string;
}

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface InvoiceEditorProps {
  clients: Client[];
  bankDetails: BankDetail[];
  cnbRates?: Record<string, number>;
  initialData?: any;
  customFields?: CustomFieldDefinition[];
}

export default function InvoiceEditor({ clients, bankDetails, cnbRates = {}, initialData, customFields = [] }: InvoiceEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { triggerTailWag, triggerCelebration } = useFoxConfetti();
  
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || "",
    number: initialData?.number || new Date().getFullYear() + "001", // Simple auto-numbering
    type: initialData?.type || "FAKTURA",
    issuedAt: initialData?.issuedAt 
      ? (typeof initialData.issuedAt === 'string' ? initialData.issuedAt : new Date(initialData.issuedAt).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0],
    dueAt: initialData?.dueAt 
      ? (typeof initialData.dueAt === 'string' ? initialData.dueAt : new Date(initialData.dueAt).toISOString().split('T')[0]) 
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: initialData?.currency || "CZK",
    bankDetailId: initialData?.bankDetailId || bankDetails[0]?.id || "",
    notes: initialData?.notes || "",
    vatMode: initialData?.vatMode || "STANDARD",
    exchangeRate: initialData?.exchangeRate || 1,
    discount: initialData?.discount || 0, // Document level discount in %
    relatedId: initialData?.relatedId || undefined,
  });

  const [items, setItems] = useState<InvoiceItemData[]>(initialData?.items || [
    { description: "", quantity: 1, unitPrice: 0, vatRate: 21, discount: 0, totalAmount: 0 }
  ]);

  // Update exchange rate when currency changes, ONLY if not editing/initializing from data with specific rate
  // Or just update if user changes currency.
  // If initialData is present, we start with its currency and rate.
  // If user changes currency, we fetch new rate.
  // Exchange rate logic is handled in handleCurrencyChange


  const handleCurrencyChange = (newCurrency: string) => {
    let newRate = formData.exchangeRate;
    if (newCurrency === "CZK") {
        newRate = 1;
    } else if (cnbRates && cnbRates[newCurrency]) {
        newRate = cnbRates[newCurrency];
    }
    setFormData({ ...formData, currency: newCurrency, exchangeRate: newRate });
  };

  const updateItem = (index: number, field: keyof InvoiceItemData, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Recalculate item total
    if (field === "quantity" || field === "unitPrice" || field === "discount") {
      const baseAmount = Number(item.quantity) * Number(item.unitPrice);
      const discountAmount = baseAmount * (Number(item.discount) / 100);
      item.totalAmount = baseAmount - discountAmount;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: 21, discount: 0, totalAmount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        clientId: formData.clientId,
        number: formData.number,
        type: formData.type,
        issuedAt: new Date(formData.issuedAt),
        dueAt: new Date(formData.dueAt),
        currency: formData.currency,
        notes: formData.notes,
        bankDetailId: formData.bankDetailId,
        vatMode: formData.vatMode,
        exchangeRate: Number(formData.exchangeRate),
        discount: Number(formData.discount),
        relatedId: formData.relatedId,
        items: items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          discount: Number(item.discount),
          totalAmount: Number(item.totalAmount)
        }))
      };

      let resultId;
      if (initialData?.id) {
        resultId = await updateInvoice(initialData.id, payload);
      } else {
        resultId = await createInvoice(payload);
      }
      
      // Fox Factor: Celebration for high value invoices (> 100k), otherwise tail wag
      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
      if (totalAmount > 100000) {
        triggerCelebration();
      } else {
        triggerTailWag();
      }

      router.push(`/invoices/${resultId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Chyba při ukládání faktury: " + (err instanceof Error ? err.message : "Neznámá chyba"));
    } finally {
      setLoading(false);
    }
  };

  // Calculations for display
  const totalNet = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const docDiscountAmount = totalNet * (formData.discount / 100);
  const finalNet = totalNet - docDiscountAmount;

  const totalVatRaw = items.reduce((sum, item) => {
    return sum + (item.totalAmount * (item.vatRate / 100));
  }, 0);
  
  const totalVat = formData.vatMode === "REVERSE_CHARGE" 
    ? 0 
    : totalVatRaw * (1 - formData.discount / 100);

  const grandTotal = finalNet + totalVat;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto p-6 bg-background">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
           {initialData ? `Úprava / Nová (${formData.type})` : "Nová faktura"}
        </h1>
        <div className="space-x-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded hover:bg-muted">Zrušit</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            {loading ? "Ukládám..." : "Uložit doklad"}
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border rounded-lg bg-card shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Typ dokladu</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            >
              <option value="FAKTURA">Faktura - Daňový doklad</option>
              <option value="PROFORMA">Zálohová faktura (Proforma)</option>
              <option value="NABIDKA">Cenová nabídka</option>
              <option value="DOBROPIS">Dobropis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Číslo dokladu</label>
            <input 
              value={formData.number}
              onChange={e => setFormData({...formData, number: e.target.value})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Režim DPH</label>
             <select 
              value={formData.vatMode}
              onChange={e => setFormData({...formData, vatMode: e.target.value})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            >
              <option value="STANDARD">Standardní režim</option>
              <option value="REVERSE_CHARGE">Přenesená daňová povinnost</option>
              <option value="OSS">Režim OSS</option>
              <option value="NON_PAYER">Neplátce DPH</option>
              <option value="IDENTIFIED_PERSON">Identifikovaná osoba</option>
            </select>
          </div>
          {formData.type === 'DOBROPIS' && (
            <div>
              <label className="block text-sm font-medium mb-1">K dokladu ID</label>
              <input 
                value={formData.relatedId || ''}
                onChange={e => setFormData({...formData, relatedId: e.target.value})}
                placeholder="ID původní faktury"
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Klient</label>
            <select 
              value={formData.clientId}
              onChange={e => setFormData({...formData, clientId: e.target.value})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              required
            >
              <option value="">Vyberte klienta...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bankovní účet</label>
            <select 
              value={formData.bankDetailId}
              onChange={e => setFormData({...formData, bankDetailId: e.target.value})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            >
              <option value="">Vyberte účet...</option>
              {bankDetails.map(b => (
                <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Celková sleva (%)</label>
            <input 
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vystaveno</label>
              <input 
                type="date"
                value={formData.issuedAt}
                onChange={e => setFormData({...formData, issuedAt: e.target.value})}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Splatnost</label>
              <input 
                type="date"
                value={formData.dueAt}
                onChange={e => setFormData({...formData, dueAt: e.target.value})}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Měna</label>
              <select 
                value={formData.currency}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              >
                <option value="CZK">CZK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            {formData.currency !== "CZK" && (
              <div>
                <label className="block text-sm font-medium mb-1">Kurz (CZK)</label>
                <input 
                  type="number"
                  step="0.001"
                  value={formData.exchangeRate}
                  onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})}
                  className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Dle ČNB: {cnbRates[formData.currency] || "N/A"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      {customFields && customFields.length > 0 && (
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-4">Doplňující údaje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-1">
                  {field.name}
                  {field.description && <span className="ml-2 text-xs text-muted-foreground">({field.description})</span>}
                </label>
                {field.type === "BOOLEAN" ? (
                  <select
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  >
                    <option value="">-</option>
                    <option value="true">Ano</option>
                    <option value="false">Ne</option>
                  </select>
                ) : field.type === "DATE" ? (
                  <input
                    type="date"
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  />
                ) : field.type === "NUMBER" ? (
                  <input
                    type="number"
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  />
                ) : (
                  <input
                    type="text"
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-[30%]">Položka</th>
              <th className="px-4 py-3 w-[10%]">Množství</th>
              <th className="px-4 py-3 w-[10%]">Jedn.</th>
              <th className="px-4 py-3 w-[15%]">Cena/jedn.</th>
              <th className="px-4 py-3 w-[10%]">Sleva %</th>
              <th className="px-4 py-3 w-[10%]">DPH %</th>
              <th className="px-4 py-3 w-[15%] text-right">Celkem bez DPH</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="p-2">
                  <input 
                    value={item.description}
                    onChange={e => updateItem(index, "description", e.target.value)}
                    placeholder="Název položky"
                    className="w-full px-2 py-1 rounded border bg-transparent"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={e => updateItem(index, "quantity", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border bg-transparent"
                  />
                </td>
                <td className="p-2">
                  <input 
                    value={item.unit || "ks"}
                    onChange={e => updateItem(index, "unit", e.target.value)}
                    className="w-full px-2 py-1 rounded border bg-transparent"
                    placeholder="ks"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, "unitPrice", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border bg-transparent"
                  />
                </td>
                <td className="p-2">
                   <input 
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={e => updateItem(index, "discount", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border bg-transparent"
                  />
                </td>
                <td className="p-2">
                  <select 
                    value={item.vatRate}
                    onChange={e => updateItem(index, "vatRate", Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border bg-transparent"
                    disabled={formData.vatMode === "REVERSE_CHARGE"}
                  >
                    <option value={21}>21 %</option>
                    <option value={12}>12 %</option>
                    <option value={0}>0 %</option>
                  </select>
                </td>
                <td className="p-2 text-right font-medium">
                  {item.totalAmount.toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  <button type="button" onClick={() => removeItem(index)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-medium">
            <tr>
              <td colSpan={7} className="p-2">
                <button type="button" onClick={addItem} className="text-primary hover:underline px-2 text-sm">
                  + Přidat položku
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/3 space-y-2 text-right">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mezisoučet:</span>
            <span>{totalNet.toFixed(2)} {formData.currency}</span>
          </div>
          {formData.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Sleva na doklad ({formData.discount} %):</span>
              <span>-{docDiscountAmount.toFixed(2)} {formData.currency}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
             <span>Základ daně:</span>
             <span>{finalNet.toFixed(2)} {formData.currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">DPH {formData.vatMode === "REVERSE_CHARGE" ? "(Přenesená)" : ""}:</span>
            <span>{totalVat.toFixed(2)} {formData.currency}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
            <span>Celkem k úhradě:</span>
            <span className="text-primary">{grandTotal.toFixed(2)} {formData.currency}</span>
          </div>
          {formData.currency !== "CZK" && (
             <div className="text-sm text-muted-foreground mt-2 border-t pt-2">
                <div>Kurz: {formData.exchangeRate} CZK/{formData.currency}</div>
                <div>Celkem v CZK: {(grandTotal * formData.exchangeRate).toFixed(2)} CZK</div>
             </div>
          )}
        </div>
      </div>
    </form>
  );
}
