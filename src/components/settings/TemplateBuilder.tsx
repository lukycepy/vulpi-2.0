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
  initialTemplate?: InvoiceTemplate;
  organizationId: string;
}

export function TemplateBuilder({ initialTemplate, organizationId }: TemplateBuilderProps) {
  const [template, setTemplate] = useState<Partial<InvoiceTemplate>>({
    name: initialTemplate?.name || "",
    primaryColor: initialTemplate?.primaryColor || "#000000",
    secondaryColor: initialTemplate?.secondaryColor || "#ffffff",
    fontFamily: initialTemplate?.fontFamily || "Inter",
    logoPosition: initialTemplate?.logoPosition || "left",
    showQrCode: initialTemplate?.showQrCode ?? true,
    showSignature: initialTemplate?.showSignature ?? true,
    customCss: initialTemplate?.customCss || "",
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    if (!template.name) {
      toast({ title: "Chyba", description: "Název šablony je povinný.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (initialTemplate) {
        await updateInvoiceTemplate(initialTemplate.id, {
          name: template.name || undefined,
          primaryColor: template.primaryColor || undefined,
          secondaryColor: template.secondaryColor || undefined,
          fontFamily: template.fontFamily || undefined,
          logoPosition: template.logoPosition || undefined,
          showQrCode: template.showQrCode,
          showSignature: template.showSignature,
          customCss: template.customCss || undefined,
        });
        toast({ title: "Úspěch", description: "Šablona byla aktualizována." });
      } else {
        await createInvoiceTemplate({
          organizationId,
          name: template.name!,
          primaryColor: template.primaryColor || undefined,
          secondaryColor: template.secondaryColor || undefined,
          fontFamily: template.fontFamily || undefined,
          logoPosition: template.logoPosition || undefined,
          showQrCode: template.showQrCode,
          showSignature: template.showSignature,
          customCss: template.customCss || undefined,
        });
        toast({ title: "Úspěch", description: "Šablona byla vytvořena." });
        router.push("/settings/templates");
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message || "Nepodařilo se uložit šablonu.", variant: "destructive" });
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Nastavení vzhledu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název šablony</Label>
              <Input 
                id="name" 
                value={template.name || ""} 
                onChange={(e) => setTemplate({ ...template, name: e.target.value })} 
                placeholder="Moje šablona"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primární barva</Label>
                <div className="flex gap-2">
                  <Input 
                    id="primaryColor" 
                    type="color" 
                    value={template.primaryColor || "#000000"} 
                    onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })} 
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={template.primaryColor || ""} 
                    onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Sekundární barva</Label>
                 <div className="flex gap-2">
                  <Input 
                    id="secondaryColor" 
                    type="color" 
                    value={template.secondaryColor || "#ffffff"} 
                    onChange={(e) => setTemplate({ ...template, secondaryColor: e.target.value })} 
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={template.secondaryColor || ""} 
                    onChange={(e) => setTemplate({ ...template, secondaryColor: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Písmo</Label>
              <Select 
                value={template.fontFamily || "Inter"} 
                onValueChange={(value: string) => setTemplate({ ...template, fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Standard)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Serif)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoPosition">Pozice loga</Label>
              <Select 
                value={template.logoPosition || "left"} 
                onValueChange={(value: string) => setTemplate({ ...template, logoPosition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Vlevo</SelectItem>
                  <SelectItem value="center">Uprostřed</SelectItem>
                  <SelectItem value="right">Vpravo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showQrCode">Zobrazit QR kód</Label>
              <Switch 
                id="showQrCode" 
                checked={template.showQrCode} 
                onCheckedChange={(checked) => setTemplate({ ...template, showQrCode: checked })} 
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showSignature">Zobrazit podpis</Label>
              <Switch 
                id="showSignature" 
                checked={template.showSignature} 
                onCheckedChange={(checked) => setTemplate({ ...template, showSignature: checked })} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customCss">Vlastní CSS (pokročilé)</Label>
              <Input 
                id="customCss" 
                value={template.customCss || ""} 
                onChange={(e) => setTemplate({ ...template, customCss: e.target.value })} 
                placeholder=".invoice-header { background: red; }"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-gray-50 overflow-hidden">
          <CardHeader>
            <CardTitle>Náhled</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="bg-white shadow-lg p-8 min-h-[600px] text-sm flex flex-col gap-6"
              style={{
                fontFamily: template.fontFamily || 'inherit',
                borderTop: `4px solid ${template.primaryColor || '#000'}`,
              }}
            >
              {/* Header */}
              <div className={`flex items-start justify-between ${template.logoPosition === 'center' ? 'flex-col items-center text-center' : template.logoPosition === 'right' ? 'flex-row-reverse' : ''}`}>
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400 mb-4">
                  LOGO
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold" style={{ color: template.primaryColor || '#000' }}>FAKTURA</h1>
                  <p className="text-gray-500">#2024001</p>
                </div>
              </div>

              {/* Supplier / Customer */}
              <div className="grid grid-cols-2 gap-8 mt-4">
                <div>
                  <h3 className="font-bold mb-2 text-gray-500 uppercase text-xs">Dodavatel</h3>
                  <p className="font-semibold">Naše Firma s.r.o.</p>
                  <p>Ulice 123</p>
                  <p>123 00 Praha</p>
                  <p>IČ: 12345678</p>
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-gray-500 uppercase text-xs">Odběratel</h3>
                  <p className="font-semibold">Zákazník a.s.</p>
                  <p>Obchodní 456</p>
                  <p>456 00 Brno</p>
                  <p>IČ: 87654321</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-xs text-gray-500">Datum vystavení</p>
                  <p>01.03.2024</p>
                </div>
                 <div>
                  <p className="text-xs text-gray-500">Datum splatnosti</p>
                  <p>15.03.2024</p>
                </div>
                 <div>
                  <p className="text-xs text-gray-500">Způsob úhrady</p>
                  <p>Převodem</p>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4">
                <table className="w-full">
                  <thead>
                    <tr style={{ color: template.primaryColor || '#000', borderBottom: `2px solid ${template.secondaryColor || '#fff'}` }}>
                      <th className="text-left py-2">Položka</th>
                      <th className="text-right py-2">Množství</th>
                      <th className="text-right py-2">Cena/j</th>
                      <th className="text-right py-2">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Konzultace</td>
                      <td className="text-right py-2">10 hod</td>
                      <td className="text-right py-2">1 500 Kč</td>
                      <td className="text-right py-2">15 000 Kč</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Grafické práce</td>
                      <td className="text-right py-2">5 hod</td>
                      <td className="text-right py-2">1 200 Kč</td>
                      <td className="text-right py-2">6 000 Kč</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-right py-4 font-bold">Celkem k úhradě:</td>
                      <td className="text-right py-4 font-bold text-lg" style={{ color: template.primaryColor || '#000' }}>21 000 Kč</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-auto flex justify-between items-end pt-8">
                 {template.showQrCode && (
                  <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                    QR Platba
                  </div>
                )}
                
                {template.showSignature && (
                  <div className="text-center">
                    <div className="w-32 h-16 border-b border-gray-300 mb-2"></div>
                    <p className="text-xs text-gray-500">Podpis a razítko</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
