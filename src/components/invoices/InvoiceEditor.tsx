"use client";

import { useState, useEffect } from "react";
import { createInvoice, updateInvoice, InvoiceItemData } from "@/actions/invoice";
import { useRouter } from "next/navigation";
import { useFoxConfetti } from "@/hooks/use-fox-confetti";
import { useFoxSound } from "@/hooks/use-fox-sound";
import { FoxSpinner } from "@/components/fox/FoxSpinner";
import { CustomFieldDefinition } from "@prisma/client";
import { HelpCircle, GripVertical, Trash2, Plus, Calculator, Sparkles, Loader2, Paperclip } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateItemDescription } from "@/actions/ai";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Simplified types for props
interface Client {
  id: string;
  name: string;
  language?: string | null;
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
  organization?: {
    defaultGdprClause?: string | null;
    defaultSlaText?: string | null;
  };
}

interface EditorItem extends InvoiceItemData {
  dndId: string;
  quantityRaw?: string;
  unitPriceRaw?: string;
  weightRaw?: string;
}

export default function InvoiceEditor({ clients, bankDetails, cnbRates = {}, initialData, customFields = [], organization }: InvoiceEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { triggerTailWag, triggerCelebration } = useFoxConfetti();
  const { playSwoosh } = useFoxSound();
  const [isDirty, setIsDirty] = useState(false);
  const [showAdvancedItems, setShowAdvancedItems] = useState(false);

  // AI Description Generator State
  const [aiPopupOpen, setAiPopupOpen] = useState(false);
  const [aiActiveItemIndex, setAiActiveItemIndex] = useState<number | null>(null);
  const [aiInputText, setAiInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // AI Handlers
  const handleOpenAiPopup = (index: number) => {
    setAiActiveItemIndex(index);
    // Pre-fill with existing description if user wants to refine it, 
    // or keep empty if they want to start fresh? 
    // User said: "zadá 'tvorba webu 3 dny'". This implies a prompt, not the description itself.
    // So I should probably start empty or with a placeholder.
    // But maybe they want to rewrite existing text.
    // Let's start empty for the prompt.
    setAiInputText(""); 
    setAiPopupOpen(true);
  };

  const handleGenerateDescription = async () => {
    if (aiActiveItemIndex === null || !aiInputText.trim()) return;

    setAiLoading(true);
    try {
      const generated = await generateItemDescription(aiInputText);
      if (generated) {
        updateItem(aiActiveItemIndex, "description", generated);
        setAiPopupOpen(false);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("Generování popisu selhalo.");
    } finally {
      setAiLoading(false);
    }
  };

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
    taxDate: initialData?.taxDate 
      ? (typeof initialData.taxDate === 'string' ? initialData.taxDate : new Date(initialData.taxDate).toISOString().split('T')[0]) 
      : new Date().toISOString().split('T')[0],
    currency: initialData?.currency || "CZK",
    language: initialData?.language || "cs",
    bankDetailId: initialData?.bankDetailId || bankDetails[0]?.id || "",
    notes: initialData?.notes || "",
    vatMode: initialData?.vatMode || "STANDARD",
    isVatInclusive: initialData?.isVatInclusive || false,
    exchangeRate: initialData?.exchangeRate || 1,
    discount: initialData?.discount || 0, // Document level discount in %
    relatedId: initialData?.relatedId || undefined,
  });

  const [items, setItems] = useState<EditorItem[]>(() => {
    const initialItems = initialData?.items || [
      { description: "", quantity: 1, unitPrice: 0, vatRate: 21, discount: 0, totalAmount: 0, unit: "ks", sku: "", weightKg: 0 }
    ];
    return initialItems.map((item: any) => ({
      ...item,
      dndId: item.id || crypto.randomUUID(),
      quantityRaw: item.quantity?.toString(),
      unitPriceRaw: item.unitPrice?.toString(),
      weightRaw: item.weightKg?.toString(),
      sku: item.sku || "",
      weightKg: item.weightKg || 0
    }));
  });

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("Máte neuložená data. Opravdu chcete odejít?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
    setIsDirty(true);
  };

  const addItem = () => {
    setItems([...items, { 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      vatRate: 21, 
      discount: 0, 
      totalAmount: 0, 
      unit: "ks",
      dndId: crypto.randomUUID(),
      quantityRaw: "1",
      unitPriceRaw: "0",
      sku: "",
      weightKg: 0,
      weightRaw: "0"
    }]);
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setIsDirty(true);
  };

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    if (initialData?.customFields) {
      initialData.customFields.forEach((cf: any) => {
        values[cf.fieldId] = cf.value;
      });
    }
    return values;
  });

  const handleCurrencyChange = (newCurrency: string) => {
    let newRate = formData.exchangeRate;
    if (newCurrency === "CZK") {
        newRate = 1;
    } else if (cnbRates && cnbRates[newCurrency]) {
        newRate = cnbRates[newCurrency];
    }
    setFormData({ ...formData, currency: newCurrency, exchangeRate: newRate });
    setIsDirty(true);
  };

  const evaluateMath = (input: string): number | null => {
    try {
        // Allow only safe characters
        if (!/^[0-9+\-*/().,\s]+$/.test(input)) return null;
        const normalized = input.replace(/,/g, '.');
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${normalized}`)();
        return isFinite(result) ? result : null;
    } catch {
        return null;
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemData | 'quantityRaw' | 'unitPriceRaw' | 'weightRaw', value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    // Handle raw inputs for calculator
    if (field === 'quantityRaw') {
        item.quantityRaw = value;
        setItems(newItems);
        setIsDirty(true);
        return;
    }
    if (field === 'unitPriceRaw') {
        item.unitPriceRaw = value;
        setItems(newItems);
        setIsDirty(true);
        return;
    }
    if (field === 'weightRaw') {
        const val = parseFloat(value.replace(',', '.'));
        item.weightKg = isNaN(val) ? 0 : val;
        item.weightRaw = value;
        setItems(newItems);
        setIsDirty(true);
        return;
    }

    // Handle standard updates
    (item as any)[field] = value;

    // Recalculate item total
    recalculateItemTotal(item);
    
    newItems[index] = item;
    setItems(newItems);
    setIsDirty(true);
  };

  const recalculateItemTotal = (item: EditorItem) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discount = Number(item.discount);
      const vatRate = Number(item.vatRate);
      
      if (formData.isVatInclusive) {
          // Price is with VAT
          const totalWithVat = qty * price;
          const discountAmount = totalWithVat * (discount / 100);
          const totalWithVatAfterDiscount = totalWithVat - discountAmount;
          
          // Base = Total / (1 + Rate/100)
          item.totalAmount = totalWithVatAfterDiscount / (1 + vatRate / 100);
      } else {
          // Price is without VAT
          const base = qty * price;
          const discountAmount = base * (discount / 100);
          item.totalAmount = base - discountAmount;
      }
  };

  // When VAT mode changes, recalculate all items
  useEffect(() => {
    const newItems = items.map(item => {
        const newItem = { ...item };
        recalculateItemTotal(newItem);
        return newItem;
    });
    // Only update if totals changed to avoid loop, but here logic depends on formData.isVatInclusive
    // We can't compare easily, but setting items triggers re-render.
    // This effect runs when formData.isVatInclusive changes.
    // We should be careful not to create infinite loop.
    // Actually, we can just do this calculation in render or when toggling the switch.
  }, [formData.isVatInclusive]); 

  const handleVatInclusiveChange = (checked: boolean) => {
      setFormData(prev => ({ ...prev, isVatInclusive: checked }));
      setIsDirty(true);
      
      // Recalculate all items immediately
      const newItems = items.map(item => {
          const newItem = { ...item };
          // We need to pass the NEW isVatInclusive value, but state update is async.
          // So we replicate logic here with 'checked' value
          const qty = Number(newItem.quantity);
          const price = Number(newItem.unitPrice);
          const discount = Number(newItem.discount);
          const vatRate = Number(newItem.vatRate);
          
          if (checked) {
              const totalWithVat = qty * price;
              const discountAmount = totalWithVat * (discount / 100);
              const totalWithVatAfterDiscount = totalWithVat - discountAmount;
              newItem.totalAmount = totalWithVatAfterDiscount / (1 + vatRate / 100);
          } else {
              const base = qty * price;
              const discountAmount = base * (discount / 100);
              newItem.totalAmount = base - discountAmount;
          }
          return newItem;
      });
      setItems(newItems);
  };

  const handleInputBlur = (index: number, field: 'quantity' | 'unitPrice') => {
      const item = items[index];
      const rawValue = field === 'quantity' ? item.quantityRaw : item.unitPriceRaw;
      
      if (rawValue) {
          const evaluated = evaluateMath(rawValue);
          if (evaluated !== null) {
              // Update both the numeric value and the raw value to show result
              // Important: we need to trigger updateItem logic which handles recalculation
              
              // First update raw to be clean number string
              const newItems = [...items];
              const newItem = { ...newItems[index] };
              
              if (field === 'quantity') {
                  newItem.quantity = evaluated;
                  newItem.quantityRaw = evaluated.toString();
              } else {
                  newItem.unitPrice = evaluated;
                  newItem.unitPriceRaw = evaluated.toString();
              }
              
              // Recalculate totals
              const qty = Number(newItem.quantity);
              const price = Number(newItem.unitPrice);
              const discount = Number(newItem.discount);
              const vatRate = Number(newItem.vatRate);
              
              if (formData.isVatInclusive) {
                  const totalWithVat = qty * price;
                  const discountAmount = totalWithVat * (discount / 100);
                  const totalWithVatAfterDiscount = totalWithVat - discountAmount;
                  newItem.totalAmount = totalWithVatAfterDiscount / (1 + vatRate / 100);
              } else {
                  const base = qty * price;
                  const discountAmount = base * (discount / 100);
                  newItem.totalAmount = base - discountAmount;
              }

              newItems[index] = newItem;
              setItems(newItems);
              setIsDirty(true);
          } else {
              // Invalid input, revert to last valid numeric value
              updateItem(index, field === 'quantity' ? 'quantityRaw' : 'unitPriceRaw', item[field].toString());
          }
      }
  };

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(initialData?.updatedAt ? new Date(initialData.updatedAt).toISOString() : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate items
      if (items.some(i => !i.description)) {
        throw new Error("Položka faktury musí mít popis");
      }

      const payload = {
        clientId: formData.clientId,
        number: formData.number,
        type: formData.type,
        issuedAt: new Date(formData.issuedAt),
        dueAt: new Date(formData.dueAt),
        taxDate: formData.taxDate ? new Date(formData.taxDate) : undefined,
        currency: formData.currency,
        language: formData.language,
        notes: formData.notes,
        bankDetailId: formData.bankDetailId,
        vatMode: formData.vatMode,
        isVatInclusive: formData.isVatInclusive,
        exchangeRate: Number(formData.exchangeRate),
        discount: Number(formData.discount),
        relatedId: formData.relatedId,
        items: items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || "ks",
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate),
          discount: Number(item.discount),
          totalAmount: Number(item.totalAmount),
          sku: item.sku,
          weightKg: Number(item.weightKg)
        })),
        customFields: Object.entries(customFieldValues).map(([fieldId, value]) => ({
          fieldId,
          value: String(value)
        }))
      };

      if (initialData?.id) {
        await updateInvoice(initialData.id, payload, lastUpdatedAt || undefined);
      } else {
        const result = await createInvoice(payload);
        
        // Check for calendar url
        const res = result as any;
        if (typeof res === 'object' && res.calendarUrl) {
            if (window.confirm("Faktura vytvořena. Chcete přidat splatnost do Google Kalendáře?")) {
                window.open(res.calendarUrl as string, "_blank");
            }
        }

        // Check for milestone in result (if object returned)
        if (typeof res === 'object' && res.milestoneReached) {
           triggerCelebration();
           alert(`Gratulujeme! Právě jste vystavili svou ${res.milestoneCount}. fakturu ve Vulpi!`);
        } else {
           triggerTailWag();
        }
      }
      
      playSwoosh();
      setIsDirty(false);
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.includes("Konflikt")) {
          alert(err.message);
      } else {
          alert("Chyba při ukládání faktury: " + (err instanceof Error ? err.message : "Neznámá chyba"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculations for display
  const totalNet = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const docDiscountAmount = totalNet * (formData.discount / 100);
  const finalNet = totalNet - docDiscountAmount;

  const totalVatRaw = items.reduce((sum, item) => {
      // Logic for VAT calculation depends on mode
      // If bottom-up: VAT = Base * Rate
      // If top-down: VAT = TotalWithVat - Base
      
      if (formData.isVatInclusive) {
          // In top-down, we stored Base in totalAmount.
          // We need to reconstruct TotalWithVat to find VAT?
          // No, VAT is just (Base * Rate) / 100 ? No.
          // If Base = Total / (1+Rate), then VAT = Total - Base = Base * (1+Rate) - Base = Base * Rate.
          // So VAT calculation formula is the same regardless of how we got Base!
          // VAT = Base * Rate.
          return sum + (item.totalAmount * (item.vatRate / 100));
      } else {
          return sum + (item.totalAmount * (item.vatRate / 100));
      }
  }, 0);
  
  const totalVat = formData.vatMode === "REVERSE_CHARGE" || formData.vatMode === "NON_PAYER"
    ? 0 
    : totalVatRaw * (1 - formData.discount / 100);

  const grandTotal = finalNet + totalVat;

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto p-6 bg-background">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
           {initialData ? `Úprava / Nová (${formData.type})` : "Nová faktura"}
        </h1>
        <div className="space-x-2">
          <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded hover:bg-muted">Zrušit</button>
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
              onChange={e => { setFormData({...formData, type: e.target.value}); setIsDirty(true); }}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            >
              <option value="FAKTURA">Faktura - Daňový doklad</option>
              <option value="PROFORMA">Zálohová faktura (Proforma)</option>
              <option value="ZALOHOVY_LIST">Zálohový list</option>
              <option value="DODACI_LIST">Dodací list</option>
              <option value="NABIDKA">Cenová nabídka</option>
              <option value="DOBROPIS">Dobropis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Číslo dokladu</label>
            <input 
              value={formData.number}
              onChange={e => { setFormData({...formData, number: e.target.value}); setIsDirty(true); }}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            />
          </div>
          <div>
             <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium">Režim DPH</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Standardní režim:</strong> Běžná faktura s DPH.<br/>
                      <strong>Přenesená daňová povinnost (Reverse Charge):</strong> DPH odvádí odběratel.<br/>
                      <strong>OSS:</strong> Prodej koncovým zákazníkům v EU.<br/>
                      <strong>Neplátce DPH:</strong> Dodavatel není plátcem DPH.
                    </p>
                  </TooltipContent>
                </Tooltip>
             </div>
             <select 
              value={formData.vatMode}
              onChange={e => { setFormData({...formData, vatMode: e.target.value}); setIsDirty(true); }}
              className="w-full h-10 px-3 py-2 rounded-md border bg-background"
            >
              <option value="STANDARD">Standardní režim</option>
              <option value="REVERSE_CHARGE">Přenesená daňová povinnost</option>
              <option value="OSS">Režim OSS</option>
              <option value="NON_PAYER">Neplátce DPH</option>
              <option value="IDENTIFIED_PERSON">Identifikovaná osoba</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
             <Switch 
               id="vat-inclusive" 
               checked={formData.isVatInclusive}
               onCheckedChange={handleVatInclusiveChange}
             />
             <Label htmlFor="vat-inclusive">Ceny zadávat s DPH (výpočet shora)</Label>
          </div>

          {formData.type === 'DOBROPIS' && (
            <div>
              <label className="block text-sm font-medium mb-1">K dokladu ID</label>
              <input 
                value={formData.relatedId || ''}
                onChange={e => { setFormData({...formData, relatedId: e.target.value}); setIsDirty(true); }}
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
              onChange={e => { 
                const newClientId = e.target.value;
                const client = clients.find(c => c.id === newClientId);
                setFormData({
                  ...formData, 
                  clientId: newClientId,
                  language: client?.language || formData.language || "cs"
                }); 
                setIsDirty(true); 
              }}
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
              onChange={e => { setFormData({...formData, bankDetailId: e.target.value}); setIsDirty(true); }}
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
              onChange={e => { setFormData({...formData, discount: Number(e.target.value)}); setIsDirty(true); }}
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
                onChange={e => { setFormData({...formData, issuedAt: e.target.value}); setIsDirty(true); }}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Splatnost</label>
              <input 
                type="date"
                value={formData.dueAt}
                onChange={e => { setFormData({...formData, dueAt: e.target.value}); setIsDirty(true); }}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium mb-1">DUZP (Datum zdaň. plnění)</label>
              <input 
                type="date"
                value={formData.taxDate}
                onChange={e => { setFormData({...formData, taxDate: e.target.value}); setIsDirty(true); }}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jazyk</label>
              <select 
                value={formData.language}
                onChange={e => { setFormData({...formData, language: e.target.value}); setIsDirty(true); }}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              >
                <option value="cs">Čeština</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="sk">Slovenčina</option>
              </select>
            </div>
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
          </div>

          {formData.currency !== "CZK" && (
            <div>
              <label className="block text-sm font-medium mb-1">Kurz (CZK)</label>
              <input 
                type="number"
                step="0.001"
                value={formData.exchangeRate}
                onChange={e => { setFormData({...formData, exchangeRate: Number(e.target.value)}); setIsDirty(true); }}
                className="w-full h-10 px-3 py-2 rounded-md border bg-background"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Dle ČNB: {cnbRates[formData.currency] || "N/A"}
              </div>
            </div>
          )}
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

                </label>
                {field.type === "BOOLEAN" ? (
                  <select
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => { setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value }); setIsDirty(true); }}
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
                    onChange={(e) => { setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value }); setIsDirty(true); }}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  />
                ) : field.type === "NUMBER" ? (
                  <input
                    type="number"
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => { setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value }); setIsDirty(true); }}
                    className="w-full h-10 px-3 py-2 rounded-md border bg-background"
                  />
                ) : (
                  <input
                    type="text"
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) => { setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value }); setIsDirty(true); }}
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
        <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
          <h3 className="font-medium">Položky faktury</h3>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-advanced" 
              checked={showAdvancedItems}
              onCheckedChange={setShowAdvancedItems}
            />
            <Label htmlFor="show-advanced" className="text-xs">Zobrazit EAN/SKU a Hmotnost</Label>
          </div>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-[40px] px-2"></th>
                {showAdvancedItems && <th className="px-4 py-3 w-[10%]">SKU/EAN</th>}
                <th className="px-4 py-3 w-[30%]">Položka</th>
                <th className="px-4 py-3 w-[10%]">Množství</th>
                <th className="px-4 py-3 w-[10%]">Jedn.</th>
                {showAdvancedItems && <th className="px-4 py-3 w-[8%]">Váha (kg)</th>}
                <th className="px-4 py-3 w-[15%]">
                    {formData.isVatInclusive ? "Cena s DPH" : "Cena/jedn."}
                </th>
                <th className="px-4 py-3 w-[10%]">Sleva %</th>
                <th className="px-4 py-3 w-[10%]">DPH %</th>
                <th className="px-4 py-3 w-[15%] text-right">Celkem bez DPH</th>
                <th className="px-4 py-3 w-[50px]"></th>
              </tr>
            </thead>
            <Droppable droppableId="invoice-items">
              {(provided) => (
                <tbody 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="divide-y"
                >
                  {items.map((item, index) => (
                    <Draggable key={item.dndId} draggableId={item.dndId} index={index}>
                      {(provided, snapshot) => (
                        <tr 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "bg-muted shadow-lg" : "bg-background"}
                        >
                          <td 
                            {...provided.dragHandleProps} 
                            className="p-2 text-center align-middle cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                          >
                            <GripVertical className="h-4 w-4 mx-auto" />
                          </td>
                          {showAdvancedItems && (
                            <td className="p-2 align-middle">
                              <input 
                                value={item.sku}
                                onChange={e => updateItem(index, "sku", e.target.value)}
                                placeholder="EAN/SKU"
                                className="w-full px-2 py-1 rounded border bg-transparent"
                              />
                            </td>
                          )}
                          <td className="p-2 align-middle">
                            <div className="flex gap-1 items-center">
                              <input 
                                value={item.description}
                                onChange={e => updateItem(index, "description", e.target.value)}
                                placeholder="Název položky"
                                className="w-full px-2 py-1 rounded border bg-transparent"
                              />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-purple-600"
                                    onClick={() => handleOpenAiPopup(index)}
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Generovat popis pomocí AI</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-2 align-middle relative group">
                            <input 
                              type="text"
                              value={item.quantityRaw || item.quantity}
                              onChange={(e) => updateItem(index, 'quantityRaw', e.target.value)}
                              onBlur={() => handleInputBlur(index, 'quantity')}
                              className="w-16 h-8 px-2 py-1 text-right border rounded"
                              placeholder="Množ."
                            />
                            <Calculator className="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 pointer-events-none" />
                          </td>
                          <td className="p-2 align-middle">
                             <input 
                              value={item.unit}
                              onChange={e => updateItem(index, "unit", e.target.value)}
                              className="w-full px-2 py-1 rounded border bg-transparent"
                            />
                          </td>
                          {showAdvancedItems && (
                            <td className="p-2 align-middle">
                              <input 
                                type="text"
                                value={item.weightRaw ?? item.weightKg}
                                onChange={e => updateItem(index, "weightRaw", e.target.value)}
                                className="w-full px-2 py-1 rounded border bg-transparent"
                              />
                            </td>
                          )}
                          <td className="p-2 align-middle relative group">
                            <input 
                              type="text"
                              value={item.unitPriceRaw ?? item.unitPrice}
                              onChange={e => updateItem(index, "unitPriceRaw", e.target.value)}
                              onBlur={() => handleInputBlur(index, 'unitPrice')}
                              className="w-24 h-8 px-2 py-1 text-right border rounded"
                              placeholder="Cena"
                            />
                            <Calculator className="h-3 w-3 absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 pointer-events-none" />
                          </td>
                          <td className="p-2 align-middle">
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={e => updateItem(index, "discount", Number(e.target.value))}
                              className="w-full px-2 py-1 rounded border bg-transparent"
                            />
                          </td>
                          <td className="p-2 align-middle">
                            <select
                              value={item.vatRate}
                              onChange={e => updateItem(index, "vatRate", Number(e.target.value))}
                              className="w-full px-2 py-1 rounded border bg-transparent"
                              disabled={formData.vatMode === "NON_PAYER"}
                            >
                              <option value="21">21%</option>
                              <option value="12">12%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="p-2 align-middle text-right font-medium">
                            {item.totalAmount.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 align-middle text-center">
                            <button 
                              type="button" 
                              onClick={() => removeItem(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
        
        <div className="p-4 bg-muted/20 border-t">
          <button 
            type="button" 
            onClick={addItem}
            className="flex items-center text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Přidat položku
          </button>
        </div>
      </div>

      {/* Notes & Totals */}
      <div className="flex flex-col md:flex-row gap-6 mt-8">
        <div className="flex-1 space-y-2">
           <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Poznámka pro odběratele</label>
              {(organization?.defaultGdprClause || organization?.defaultSlaText) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                     const texts = [organization.defaultSlaText, organization.defaultGdprClause].filter(Boolean).join("\n\n");
                     if (texts) {
                        setFormData(prev => ({
                            ...prev,
                            notes: prev.notes ? prev.notes + "\n\n" + texts : texts
                        }));
                        setIsDirty(true);
                     }
                  }}
                >
                  <Paperclip className="h-3 w-3 mr-2" />
                  Připojit SLA/GDPR
                </Button>
              )}
           </div>
           <Textarea 
             value={formData.notes}
             onChange={e => { setFormData({...formData, notes: e.target.value}); setIsDirty(true); }}
             placeholder="Text, který se zobrazí na faktuře..."
             className="min-h-[100px]"
           />
        </div>

        <div className="w-full md:w-1/3 space-y-2 p-6 bg-card border rounded-lg shadow-sm">
          <div className="flex justify-between text-sm">
            <span>Základ daně:</span>
            <span>{finalNet.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>DPH:</span>
            <span>{totalVat.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Celkem:</span>
            <span>{grandTotal.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}</span>
          </div>
        </div>
      </div>

      <Dialog open={aiPopupOpen} onOpenChange={setAiPopupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Generátor popisu</DialogTitle>
            <DialogDescription>
              Zadejte krátký popis služby (např. "tvorba webu 3 dny") a AI navrhne profesionální textaci.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Zadejte klíčová slova..."
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiPopupOpen(false)} disabled={aiLoading}>
              Zrušit
            </Button>
            <Button onClick={handleGenerateDescription} disabled={aiLoading || !aiInputText.trim()}>
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Vygenerovat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </form>
    </TooltipProvider>
  );
}