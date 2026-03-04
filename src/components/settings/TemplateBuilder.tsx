"use client";

import { useState } from "react";
import { InvoiceTemplate } from "@/types";
import { createInvoiceTemplate, updateInvoiceTemplate } from "@/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

interface TemplateBuilderProps {
  initialTemplate?: any; // Using any to avoid strict type issues with Partial<InvoiceTemplate>
  organizationId: string;
}

export function TemplateBuilder({ initialTemplate, organizationId }: TemplateBuilderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [template, setTemplate] = useState({
    name: initialTemplate?.name || "Moje šablona",
    primaryColor: initialTemplate?.primaryColor || "#000000",
    secondaryColor: initialTemplate?.secondaryColor || "#ffffff",
    fontFamily: initialTemplate?.fontFamily || "Helvetica",
    logoPosition: initialTemplate?.logoPosition || "left",
    showQrCode: initialTemplate?.showQrCode ?? true,
    showSignature: initialTemplate?.showSignature ?? true,
    customCss: initialTemplate?.customCss || "",
  });

  const handleChange = (key: string, value: any) => {
    setTemplate(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!template.name) {
      toast({ title: "Chyba", description: "Název šablony je povinný.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (initialTemplate?.id) {
        await updateInvoiceTemplate(initialTemplate.id, template);
        toast({ title: "Uloženo", description: "Šablona byla aktualizována." });
      } else {
        await createInvoiceTemplate({
          ...template,
          organizationId
        });
        toast({ title: "Vytvořeno", description: "Nová šablona byla uložena." });
        router.push("/settings/templates"); // Redirect after create
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
          {initialTemplate ? "Uložit změny" : "Vytvořit šablonu"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nastavení vzhledu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
                <Label htmlFor="name">Název šablony</Label>
                <Input 
                    id="name" 
                    value={template.name} 
                    onChange={(e) => handleChange("name", e.target.value)} 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="primaryColor">Základní barva</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="primaryColor" 
                            type="color" 
                            className="w-12 h-10 p-1 cursor-pointer"
                            value={template.primaryColor} 
                            onChange={(e) => handleChange("primaryColor", e.target.value)} 
                        />
                        <Input 
                            value={template.primaryColor} 
                            onChange={(e) => handleChange("primaryColor", e.target.value)} 
                            className="font-mono"
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="logoPosition">Pozice loga</Label>
                    <Select 
                        value={template.logoPosition} 
                        onValueChange={(val: string) => handleChange("logoPosition", val)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Vlevo</SelectItem>
                            <SelectItem value="center">Na střed</SelectItem>
                            <SelectItem value="right">Vpravo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                <Label htmlFor="showQrCode" className="flex flex-col cursor-pointer">
                    <span>QR kód k platbě</span>
                    <span className="font-normal text-xs text-muted-foreground">Zobrazit QR pro rychlou platbu</span>
                </Label>
                <Switch 
                    id="showQrCode" 
                    checked={template.showQrCode}
                    onCheckedChange={(checked) => handleChange("showQrCode", checked)}
                />
            </div>

            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                <Label htmlFor="showSignature" className="flex flex-col cursor-pointer">
                    <span>Razítko a podpis</span>
                    <span className="font-normal text-xs text-muted-foreground">Zobrazit obrázek podpisu v patičce</span>
                </Label>
                <Switch 
                    id="showSignature" 
                    checked={template.showSignature}
                    onCheckedChange={(checked) => handleChange("showSignature", checked)}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="customCss">Vlastní CSS (pro experty)</Label>
                <textarea 
                    id="customCss"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    value={template.customCss || ""}
                    onChange={(e) => handleChange("customCss", e.target.value)}
                    placeholder=".invoice-title { color: red; }"
                />
            </div>

          </CardContent>
        </Card>

        {/* Live Preview (Mock) */}
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Náhled</CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="bg-white shadow-lg p-8 aspect-[1/1.414] text-xs flex flex-col relative"
                    style={{ fontFamily: template.fontFamily === 'Helvetica' ? 'sans-serif' : 'serif' }}
                >
                    {/* Header */}
                    <div className={`flex mb-8 ${template.logoPosition === 'center' ? 'justify-center' : template.logoPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-400">LOGO</div>
                    </div>

                    <div className="flex justify-between mb-8">
                        <div>
                            <h1 className="text-xl font-bold mb-2" style={{ color: template.primaryColor }}>FAKTURA</h1>
                            <p>Číslo: 2024001</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">Dodavatel</p>
                            <p>Moje Firma s.r.o.</p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="flex-1">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${template.primaryColor}` }}>
                                    <th className="text-left py-2">Položka</th>
                                    <th className="text-right py-2">Cena</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-2">Konzultace</td>
                                    <td className="py-2 text-right">1 000 Kč</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2">Grafické práce</td>
                                    <td className="py-2 text-right">5 000 Kč</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-between items-end">
                        <div>
                            {template.showQrCode && (
                                <div className="w-24 h-24 bg-gray-100 border flex items-center justify-center text-[10px] text-gray-500">
                                    QR Platba
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold">Celkem: 6 000 Kč</p>
                            {template.showSignature && (
                                <div className="mt-4 border-t w-32 ml-auto pt-2 text-center text-gray-400 text-[10px]">
                                    Podpis a razítko
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
