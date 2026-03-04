
"use client";

import { useState } from "react";
import { updateOrganization, addBankDetail, removeBankDetail } from "@/actions/organization";
import { uploadAvatar } from "@/actions/upload"; // Use uploadAvatar for stamp as well, it returns URL
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Props definition to match the server component's data
interface OrganizationSettingsFormProps {
  org: any; // We can be more specific if we import types, but 'any' is fine for migration now
  canManageSettings: boolean;
}

export function OrganizationSettingsForm({ org, canManageSettings }: OrganizationSettingsFormProps) {
  const [vatPayerStatus, setVatPayerStatus] = useState(org.vatPayerStatus || "NON_PAYER");
  const [stampUrl, setStampUrl] = useState(org.logoUrl || ""); // Using logoUrl field for stamp temporarily if no stampUrl exists in schema
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleVatPayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVatPayerStatus(e.target.value);
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      
      const result = await uploadAvatar(formData); // Reusing upload action
      if (result.success) {
        setStampUrl(result.url);
        toast({ title: "Nahráno", description: "Razítko bylo úspěšně nahráno." });
      }
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
        await updateOrganization({
          name: formData.get("name") as string,
          logoUrl: stampUrl, // Save stamp URL
          taxId: formData.get("taxId") as string,
          vatId: formData.get("vatId") as string,
          vatPayerStatus: formData.get("vatPayerStatus") as string,
          defaultVatMode: formData.get("defaultVatMode") as string,
          address: formData.get("address") as string,
          web: formData.get("web") as string,
          email: formData.get("email") as string,
          phone: formData.get("phone") as string,
          isLegalHold: formData.get("isLegalHold") === "on",
          defaultGdprClause: formData.get("defaultGdprClause") as string,
          defaultSlaText: formData.get("defaultSlaText") as string,
          christmasMode: formData.get("christmasMode") === "on",
          numberFormat: formData.get("numberFormat") as string,
          timeFormat: formData.get("timeFormat") as string,
          weekStart: formData.get("weekStart") as string,
          // SMTP
          smtpHost: formData.get("smtpHost") as string,
          smtpPort: formData.get("smtpPort") as string,
          smtpUser: formData.get("smtpUser") as string,
          smtpPassword: formData.get("smtpPassword") as string,
          smtpFrom: formData.get("smtpFrom") as string,
          // IMAP
          imapHost: formData.get("imapHost") as string,
          imapPort: formData.get("imapPort") as string,
          imapUser: formData.get("imapUser") as string,
          imapPassword: formData.get("imapPassword") as string,
          imapEnabled: formData.get("imapEnabled") === "on",
        });
        toast({ title: "Uloženo", description: "Nastavení organizace bylo aktualizováno." });
    } catch (error: any) {
        toast({ title: "Chyba", description: error.message || "Nepodařilo se uložit nastavení.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        Nemáte oprávnění pro správu nastavení organizace.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="pb-24">
        <div className="flex items-center justify-between mb-6 sticky top-16 bg-background/95 backdrop-blur z-30 py-4 border-b">
          <h1 className="text-3xl font-bold">Nastavení organizace</h1>
          <Button type="submit" size="lg" className="gap-2" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "Ukládám..." : "Uložit změny"}
          </Button>
        </div>
      
        <div className="grid gap-8">
          {/* Basic Info */}
          <section className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Základní údaje</h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Název firmy</span>
                  <input name="name" defaultValue={org.name} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">IČO</span>
                  <input name="taxId" defaultValue={org.taxId || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">DIČ</span>
                  <input name="vatId" defaultValue={org.vatId || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Web</span>
                  <input name="web" defaultValue={org.web || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Plátce DPH</span>
                  <select 
                    name="vatPayerStatus" 
                    value={vatPayerStatus}
                    onChange={handleVatPayerChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="NON_PAYER">Neplátce DPH</option>
                    <option value="PAYER">Plátce DPH</option>
                    <option value="IDENTIFIED_PERSON">Identifikovaná osoba</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Výchozí režim DPH</span>
                  <select 
                    name="defaultVatMode" 
                    defaultValue={org.defaultVatMode || "STANDARD"} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                    disabled={vatPayerStatus === "NON_PAYER"}
                  >
                    <option value="STANDARD">Standardní</option>
                    <option value="REVERSE_CHARGE">Reverse Charge</option>
                    <option value="OSS">OSS</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Email</span>
                  <input name="email" defaultValue={org.email || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Telefon</span>
                  <input name="phone" defaultValue={org.phone || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium">Adresa</span>
                <textarea name="address" defaultValue={org.address || ""} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </label>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Razítko a Podpis</h3>
                <div className="flex items-center gap-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center w-40 h-40 bg-gray-50">
                    {stampUrl ? (
                      <img src={stampUrl} alt="Razítko" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center">Žádné razítko</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Nahrávám..." : "Nahrát razítko"}
                      <input type="file" className="hidden" accept="image/*" onChange={handleStampUpload} disabled={uploading} />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Doporučená velikost: 400x200px, PNG s průhledným pozadím.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Legislativa a Právní nastavení</h3>
                
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                    <input 
                      type="checkbox" 
                      name="isLegalHold" 
                      id="isLegalHold" 
                      defaultChecked={org.isLegalHold} 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <label htmlFor="isLegalHold" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Aktivovat Legal Hold (Zámek proti smazání)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Pokud je aktivní, nelze v systému mazat žádné faktury, náklady ani klienty. Použijte při probíhající kontrole.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium">Výchozí text SLA doložky</span>
                      <textarea 
                        name="defaultSlaText" 
                        defaultValue={org.defaultSlaText || ""} 
                        placeholder="Např. Garantovaná dostupnost služby je 99.9%..."
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" 
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">Výchozí text GDPR doložky</span>
                      <textarea 
                        name="defaultGdprClause" 
                        defaultValue={org.defaultGdprClause || ""} 
                        placeholder="Např. Osobní údaje jsou zpracovávány v souladu s..."
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Personalizace</h3>
                <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                    <input 
                      type="checkbox" 
                      name="christmasMode" 
                      id="christmasMode" 
                      defaultChecked={org.christmasMode} 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <label htmlFor="christmasMode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vánoční režim
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Zapne efekt padajícího sněhu v celé aplikaci. Automaticky se zapíná 20. - 26. prosince.
                      </p>
                    </div>
                  </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Formáty a lokalizace</h3>
                <div className="grid grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">Formát čísel</span>
                    <select name="numberFormat" defaultValue={org.numberFormat || "SPACE_COMMA"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="SPACE_COMMA">1 000,00</option>
                      <option value="COMMA_DOT">1,000.00</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Formát času</span>
                    <select name="timeFormat" defaultValue={org.timeFormat || "24h"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="24h">24h (14:00)</option>
                      <option value="12h">12h (2:00 PM)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Začátek týdne</span>
                    <select name="weekStart" defaultValue={org.weekStart || "MONDAY"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="MONDAY">Pondělí</option>
                      <option value="SUNDAY">Neděle</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">SMTP Nastavení (Odesílání e-mailů)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nastavte vlastní SMTP server pro odesílání faktur z vaší domény.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">SMTP Server (Host)</span>
                    <input name="smtpHost" defaultValue={org.smtpHost || ""} placeholder="např. smtp.gmail.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">SMTP Port</span>
                    <input name="smtpPort" defaultValue={org.smtpPort || "587"} placeholder="587" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Uživatel (Email)</span>
                    <input name="smtpUser" defaultValue={org.smtpUser || ""} placeholder="faktury@mojefirma.cz" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Heslo (App Password)</span>
                    <input type="password" name="smtpPassword" defaultValue={org.smtpPassword || ""} placeholder="••••••" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium mb-4">IMAP Nastavení (Příjem e-mailů)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nastavte IMAP server pro příjem odpovědí a párování plateb (např. od AirBank).
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">IMAP Server (Host)</span>
                    <input name="imapHost" defaultValue={org.imapHost || ""} placeholder="např. imap.gmail.com" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">IMAP Port</span>
                    <input name="imapPort" defaultValue={org.imapPort || "993"} placeholder="993" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Uživatel (Email)</span>
                    <input name="imapUser" defaultValue={org.imapUser || ""} placeholder="faktury@mojefirma.cz" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Heslo (App Password)</span>
                    <input type="password" name="imapPassword" defaultValue={org.imapPassword || ""} placeholder="••••••" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
    </form>
  );
}
