"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InvoiceTemplate } from "@/types";
import { createInvoiceTemplate, updateInvoiceTemplate, sendTestEmail } from "@/actions/templates";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { InvoicePreview } from "./InvoicePreview";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

const templateSchema = z.object({
  name: z.string().min(1, "Název je povinný"),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Neplatná barva"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Neplatná barva"),
  fontFamily: z.string(),
  logoPosition: z.enum(["left", "center", "right"]),
  showQrCode: z.boolean(),
  showSignature: z.boolean(),
  showBarcodes: z.boolean(),
  customCss: z.string().optional(),
  customFontUrl: z.string().optional(),
  textOverrides: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const COLOR_PALETTES = [
  { name: "Modrá Business", primary: "#3B82F6", secondary: "#F3F4F6" },
  { name: "Červená Moderní", primary: "#EF4444", secondary: "#1F2937" },
  { name: "Zelená Eco", primary: "#10B981", secondary: "#FFFFFF" },
  { name: "Fialová Creative", primary: "#8B5CF6", secondary: "#111827" },
  { name: "Oranžová Fox", primary: "#F97316", secondary: "#FFF7ED" },
  { name: "Tmavá Dark", primary: "#1F2937", secondary: "#111827" },
];

interface TemplateEditorProps {
  template?: InvoiceTemplate;
  organizationId: string;
}

export function TemplateEditor({ template, organizationId }: TemplateEditorProps) {
  const router = useRouter();
  const { toast, toasts } = useToast();
  const [loading, setLoading] = useState(false);

  const defaultValues: TemplateFormValues = {
    name: template?.name || "Nová šablona",
    description: template?.description || "",
    primaryColor: template?.primaryColor || "#000000",
    secondaryColor: template?.secondaryColor || "#ffffff",
    fontFamily: template?.fontFamily || "Helvetica",
    logoPosition: (template?.logoPosition as "left" | "center" | "right") || "left",
    showQrCode: template?.showQrCode ?? true,
    showSignature: template?.showSignature ?? true,
    showBarcodes: template?.showBarcodes ?? false,
    customCss: template?.customCss || "",
    customFontUrl: template?.customFontUrl || "",
    textOverrides: template?.textOverrides || "{}",
  };

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });

  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    try {
      return defaultValues.textOverrides ? JSON.parse(defaultValues.textOverrides) : {};
    } catch {
      return {};
    }
  });

  const updateOverride = (key: string, value: string) => {
    const newOverrides = { ...overrides, [key]: value };
    // Remove empty keys
    if (!value) delete newOverrides[key];
    
    setOverrides(newOverrides);
    form.setValue("textOverrides", JSON.stringify(newOverrides), { shouldDirty: true });
  };

  const watchAllFields = form.watch();

  const onSubmit = async (data: TemplateFormValues) => {
    setLoading(true);
    try {
      if (template) {
        await updateInvoiceTemplate(template.id, data);
        toast({ title: "Šablona aktualizována", description: "Změny byly úspěšně uloženy." });
      } else {
        await createInvoiceTemplate({
          organizationId,
          ...data,
        });
        toast({ title: "Šablona vytvořena", description: "Nová šablona byla úspěšně vytvořena." });
        router.push("/settings/templates");
      }
      router.refresh();
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se uložit šablonu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setLoading(true);
    try {
      await sendTestEmail(organizationId);
      toast({ title: "Odesláno", description: "Testovací e-mail byl odeslán na vaši adresu." });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se odeslat testovací e-mail.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full relative">
      {/* Toast Notification Area */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t, i) => (
            <div key={i} className={`p-4 rounded shadow-lg text-white ${t.variant === 'destructive' ? 'bg-red-500' : 'bg-green-500'}`}>
              <div className="font-bold">{t.title}</div>
              <div className="text-sm">{t.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{template ? "Upravit šablonu" : "Nová šablona"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Název šablony</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Popis</Label>
                  <Input id="description" {...form.register("description")} />
                </div>
              </div>

              <Tabs defaultValue="design">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="design">Vzhled</TabsTrigger>
                  <TabsTrigger value="texts">Texty</TabsTrigger>
                  <TabsTrigger value="advanced">Pokročilé</TabsTrigger>
                </TabsList>
                
                <TabsContent value="design" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Rychlé palety</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTES.map((palette) => (
                        <div 
                          key={palette.name}
                          className="flex flex-col items-center gap-1 cursor-pointer group"
                          onClick={() => {
                            form.setValue("primaryColor", palette.primary);
                            form.setValue("secondaryColor", palette.secondary);
                          }}
                        >
                          <div className="flex w-16 h-8 rounded border overflow-hidden shadow-sm group-hover:ring-2 ring-primary transition-all">
                            <div className="w-1/2 h-full" style={{ backgroundColor: palette.primary }} />
                            <div className="w-1/2 h-full" style={{ backgroundColor: palette.secondary }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{palette.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primární barva</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="color" 
                          id="primaryColor" 
                          className="w-12 h-12 p-1 cursor-pointer" 
                          {...form.register("primaryColor")} 
                        />
                        <Input 
                          type="text" 
                          placeholder="#000000" 
                          {...form.register("primaryColor")} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Sekundární barva</Label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="color" 
                          id="secondaryColor" 
                          className="w-12 h-12 p-1 cursor-pointer" 
                          {...form.register("secondaryColor")} 
                        />
                         <Input 
                          type="text" 
                          placeholder="#ffffff" 
                          {...form.register("secondaryColor")} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Písmo (Font)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("fontFamily")}
                    >
                      <option value="Helvetica">Helvetica (Standard)</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Custom">Vlastní (z URL)</option>
                    </select>
                  </div>
                  
                  {watchAllFields.fontFamily === "Custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="customFontUrl">URL vlastního fontu (WOFF/WOFF2)</Label>
                      <Input 
                        id="customFontUrl" 
                        placeholder="https://example.com/fonts/myfont.woff2" 
                        {...form.register("customFontUrl")} 
                      />
                      <p className="text-xs text-muted-foreground">
                        Zadejte přímý odkaz na soubor fontu. Font musí být dostupný přes HTTPS a mít povolené CORS.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="logoPosition">Pozice loga</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("logoPosition")}
                    >
                      <option value="left">Vlevo</option>
                      <option value="center">Uprostřed</option>
                      <option value="right">Vpravo</option>
                    </select>
                  </div>

                   <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <Label htmlFor="showQrCode" className="flex flex-col space-y-1">
                      <span>Zobrazit QR kód</span>
                      <span className="font-normal text-xs text-muted-foreground">Přidá QR kód pro platbu na konec faktury.</span>
                    </Label>
                    <Switch
                      id="showQrCode"
                      checked={watchAllFields.showQrCode}
                      onCheckedChange={(checked) => form.setValue("showQrCode", checked)}
                    />
                  </div>

                   <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <Label htmlFor="showSignature" className="flex flex-col space-y-1">
                      <span>Zobrazit podpis</span>
                      <span className="font-normal text-xs text-muted-foreground">Přidá pole pro podpis a razítko.</span>
                    </Label>
                    <Switch
                      id="showSignature"
                      checked={watchAllFields.showSignature}
                      onCheckedChange={(checked) => form.setValue("showSignature", checked)}
                    />
                  </div>

                   <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <Label htmlFor="showBarcodes" className="flex flex-col space-y-1">
                      <span>Zobrazit čárové kódy (EAN/SKU)</span>
                      <span className="font-normal text-xs text-muted-foreground">Přidá sloupec SKU a vyrenderuje čárový kód pod názvem položky.</span>
                    </Label>
                    <Switch
                      id="showBarcodes"
                      checked={watchAllFields.showBarcodes}
                      onCheckedChange={(checked) => form.setValue("showBarcodes", checked)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="texts" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="override-title">Nadpis faktury</Label>
                          <Input 
                              id="override-title" 
                              placeholder="Faktura" 
                              value={overrides.invoice || ""} 
                              onChange={(e) => updateOverride("invoice", e.target.value)} 
                          />
                           <p className="text-xs text-muted-foreground">Přepíše &quot;Faktura&quot;. Např. &quot;Daňový doklad&quot;, &quot;Vyúčtování&quot;</p>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="override-dueDate">Datum splatnosti</Label>
                          <Input 
                              id="override-dueDate" 
                              placeholder="Datum splatnosti" 
                              value={overrides.dueAt || ""} 
                              onChange={(e) => updateOverride("dueAt", e.target.value)} 
                          />
                          <p className="text-xs text-muted-foreground">Přepíše &quot;Datum splatnosti&quot;. Např. &quot;Uhradit do&quot;, &quot;Splatnost&quot;</p>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="override-total">Celkem</Label>
                          <Input 
                              id="override-total" 
                              placeholder="Celkem" 
                              value={overrides.total || ""} 
                              onChange={(e) => updateOverride("total", e.target.value)} 
                          />
                          <p className="text-xs text-muted-foreground">Přepíše &quot;Celkem&quot;. Např. &quot;K úhradě&quot;, &quot;Suma&quot;</p>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="override-supplier">Dodavatel</Label>
                          <Input 
                              id="override-supplier" 
                              placeholder="Dodavatel" 
                              value={overrides.supplier || ""} 
                              onChange={(e) => updateOverride("supplier", e.target.value)} 
                          />
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="override-customer">Odběratel</Label>
                          <Input 
                              id="override-customer" 
                              placeholder="Odběratel" 
                              value={overrides.subscriber || ""} 
                              onChange={(e) => updateOverride("subscriber", e.target.value)} 
                          />
                      </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="customCss">Vlastní CSS (Expert)</Label>
                    <Textarea 
                      id="customCss" 
                      placeholder=".invoice-header { color: red; }" 
                      className="font-mono text-sm h-40"
                      {...form.register("customCss")} 
                    />
                    <p className="text-xs text-gray-500">
                      Zde můžete vložit vlastní CSS styly pro detailní úpravu vzhledu.
                      Používejte opatrně!
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={handleSendTestEmail} disabled={loading}>
                <Mail className="mr-2 h-4 w-4" />
                Odeslat testovací e-mail
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Zrušit
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {template ? "Uložit změny" : "Vytvořit šablonu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className="sticky top-6 h-[calc(100vh-3rem)]">
        <h2 className="text-lg font-semibold mb-4">Náhled faktury</h2>
        <div className="h-full border rounded-lg overflow-auto bg-gray-50 p-4 shadow-inner">
           {/* Using the watched values for real-time preview */}
           <InvoicePreview template={watchAllFields} />
        </div>
      </div>
    </div>
  );
}
