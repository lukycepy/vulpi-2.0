
"use client";

import { createExpense, suggestExpenseCategory } from "@/actions/expenses";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Calendar, Building2, Tag, FileText, Briefcase, Loader2, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Project {
  id: string;
  name: string;
}

export function ExpenseForm({ categories, projects }: { categories: Category[], projects?: Project[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubcontractor, setIsSubcontractor] = useState(false);
  
  // Controlled inputs for AI suggestions
  const [supplierName, setSupplierName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestion = async () => {
    if (!supplierName) return;
    
    // Don't overwrite if user already selected a category
    if (categoryId) return;

    setIsSuggesting(true);
    try {
        const suggestedId = await suggestExpenseCategory(supplierName, description);
        if (suggestedId) {
            setCategoryId(suggestedId);
            toast({
                title: "Kategorie navržena",
                description: "Kategorie byla automaticky vybrána na základě dodavatele.",
            });
        }
    } catch (error) {
        console.error("Failed to suggest category:", error);
    } finally {
        setIsSuggesting(false);
    }
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    if (isSubcontractor) {
        formData.set("isSubcontractorCost", "true");
    }
    
    // Ensure controlled values are in formData (though name attribute handles this usually, 
    // but we want to be sure about the state values if they differ)
    // Actually, inputs with name attribute will be in formData automatically.
    
    try {
        const result = await createExpense(formData);
        
        if (result.possibleDuplicate) {
             toast({
                title: "Možný duplikát",
                description: "Tento náklad vypadá jako duplikát (shodný dodavatel a částka v posledních 7 dnech).",
                variant: "destructive"
            });
            // We still redirect, but maybe user wants to know?
            // The requirement says: "označí náklad příznakem possibleDuplicate a v UI zobrazí varování."
            // It doesn't say we should block it.
            // But if we redirect immediately, the toast might be lost if it's not persisted.
            // Our simple toast implementation is local state in Toaster.
            // If we navigate, the layout remains mounted, so Toaster remains mounted?
            // Yes, Toaster is in RootLayout.
            // But router.push triggers a navigation.
            // If the page content changes, Toaster (in layout) should persist?
            // Yes, usually.
        } else {
             toast({
                title: "Výdaj uložen",
                description: "Výdaj byl úspěšně uložen.",
            });
        }

        router.push("/expenses");
        router.refresh();
    } catch (error) {
        console.error(error);
        setLoading(false);
        toast({
            title: "Chyba",
            description: "Chyba při ukládání výdaje: " + (error instanceof Error ? error.message : "Neznámá chyba"),
            variant: "destructive"
        });
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Popis výdaje
          </label>
          <input
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSuggestion}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="např. Kancelářské potřeby"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Dodavatel
          </label>
          <div className="relative">
            <input
                name="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                onBlur={handleSuggestion}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="např. Alza.cz"
            />
            {isSuggesting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Kategorie
            {isSuggesting && <Sparkles className="h-3 w-3 ml-2 text-yellow-500 animate-pulse" />}
          </label>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Bez kategorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Projekt
          </label>
          <select
            name="projectId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">-- Vyberte projekt --</option>
            {projects?.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Datum
          </label>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Částka
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              name="amount"
              step="0.01"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="0.00"
            />
            <select
              name="currency"
              defaultValue="CZK"
              className="w-24 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Účtenka / Faktura (PDF, IMG)
          </label>
          <input
            type="file"
            name="receipt"
            accept="image/*,application/pdf"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        
        <div className="col-span-full flex items-center space-x-2 pt-2">
            <Checkbox 
                id="isSubcontractor" 
                checked={isSubcontractor} 
                onCheckedChange={(checked) => setIsSubcontractor(checked === true)}
            />
            <label
                htmlFor="isSubcontractor"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                Jedná se o náklad na subdodávku (započítat do ziskovosti projektu)
            </label>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-full md:w-auto"
        >
          {loading ? "Ukládám..." : "Uložit výdaj"}
        </button>
      </div>
    </form>
  );
}
