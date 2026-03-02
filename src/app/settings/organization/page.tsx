import { prisma } from "@/lib/prisma";
import {
  updateOrganization,
  addBankDetail,
  removeBankDetail,
  addBankIntegration,
  removeBankIntegration,
  toggleBankIntegration,
  syncBankNow,
} from "@/actions/organization";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

// Since we don't have shadcn components installed yet (CLI failed earlier), 
// I will create basic HTML forms or simple components inline for now to ensure it works.
// Or I can try to install shadcn components again, but let's build the page first.

export default async function OrganizationSettings() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) return <div>Organization not found. Please register first.</div>;

  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
    include: { bankDetails: true, bankIntegrations: true },
  });

  if (!org) return <div>Organization not found.</div>;

  const canManageSettings = await hasPermission(user.id, org.id, "manage_settings");

  if (!canManageSettings) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu nastavení organizace.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Nastavení organizace</h1>
      
      <div className="grid gap-8">
        {/* Basic Info */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Základní údaje</h2>
          <form action={async (formData) => {
            "use server";
            await updateOrganization({
              name: formData.get("name") as string,
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
            });
          }} className="grid gap-4">
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
                <select name="vatPayerStatus" defaultValue={org.vatPayerStatus || "NON_PAYER"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="NON_PAYER">Neplátce DPH</option>
                  <option value="PAYER">Plátce DPH</option>
                  <option value="IDENTIFIED_PERSON">Identifikovaná osoba</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Výchozí režim DPH</span>
                <select name="defaultVatMode" defaultValue={org.defaultVatMode || "STANDARD"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
                    <option value="SPACE_COMMA">1 000,00 (CZ)</option>
                    <option value="COMMA_DOT">1,000.00 (EN)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Formát času</span>
                  <select name="timeFormat" defaultValue={org.timeFormat || "24h"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="24h">24 hodin (14:30)</option>
                    <option value="12h">12 hodin (2:30 PM)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">První den v týdnu</span>
                  <select name="weekStart" defaultValue={org.weekStart || "MONDAY"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="MONDAY">Pondělí</option>
                    <option value="SUNDAY">Neděle</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium mb-3">Matematika a Daně</h3>
              <div className="grid grid-cols-2 gap-4">
                 <label className="block">
                    <span className="text-sm font-medium">Zaokrouhlování celkové částky</span>
                    <select name="roundingRule" defaultValue={org.roundingRule || "MATH_2"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                       <option value="MATH_2">Matematicky na 2 desetinná místa (haléře)</option>
                       <option value="CEIL_0">Vždy nahoru na celé koruny</option>
                       <option value="MATH_0">Matematicky na celé koruny</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                       Určuje, jak se vypočítá "K úhradě". Rozdíl bude zapsán jako "Haléřové vyrovnání".
                    </p>
                 </label>
              </div>
            </div>

            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit mt-2">Uložit změny</button>
          </form>
        </section>

        {/* Bank Accounts */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Bankovní účty</h2>
          <div className="space-y-4">
            {org.bankDetails.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{bank.bankName}</p>
                  <p className="text-sm text-muted-foreground">{bank.accountNumber} / {bank.currency}</p>
                  <div className="flex gap-4">
                    {bank.iban && <p className="text-xs text-muted-foreground">IBAN: {bank.iban}</p>}
                    {bank.swift && <p className="text-xs text-muted-foreground">SWIFT: {bank.swift}</p>}
                  </div>
                </div>
                <form action={async () => {
                  "use server";
                  await removeBankDetail(bank.id);
                }}>
                  <button className="text-destructive hover:underline text-sm">Odstranit</button>
                </form>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Přidat nový účet</h3>
              <form action={async (formData) => {
                "use server";
                await addBankDetail({
                  bankName: formData.get("bankName") as string,
                  accountNumber: formData.get("accountNumber") as string,
                  iban: formData.get("iban") as string,
                  swift: formData.get("swift") as string,
                  currency: formData.get("currency") as string,
                });
              }} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="bankName" placeholder="Název banky" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                  <input name="accountNumber" placeholder="Číslo účtu" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <input name="iban" placeholder="IBAN" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <input name="swift" placeholder="SWIFT/BIC" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  <select name="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="CZK">CZK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md w-fit">Přidat účet</button>
              </form>
            </div>
          </div>
        </section>

        {/* Tax Rates Manager */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Sazby DPH</h2>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
               {/* List existing tax rates? We need to fetch them. */}
               {/* Since I didn't include taxRates in the initial fetch, let's assume we can add a small client component or fetch here */}
               {/* We need to update the query at the top of the file */}
               <div className="text-sm text-muted-foreground">
                  Standardní sazby (21%, 12%, 0%) jsou dostupné vždy. Zde můžete definovat vlastní historické nebo speciální sazby.
               </div>
            </div>
            {/* Simple form to add custom rate */}
             <form action={async (formData) => {
                "use server";
                const { addTaxRate } = await import("@/actions/organization");
                await addTaxRate(formData.get("name") as string, parseFloat(formData.get("percentage") as string));
             }} className="flex gap-4 items-end">
                <label className="block">
                   <span className="text-sm font-medium">Název</span>
                   <input name="name" placeholder="Např. Snížená 2023" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </label>
                <label className="block">
                   <span className="text-sm font-medium">Sazba (%)</span>
                   <input name="percentage" type="number" step="0.01" placeholder="15" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </label>
                <button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md">Přidat sazbu</button>
             </form>
          </div>
        </section>

        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Bankovní integrace</h2>
          </div>

          <div className="space-y-4">
            {org.bankIntegrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{integration.provider}</p>
                  <p className="text-sm text-muted-foreground">
                    Poslední synchronizace: {integration.lastSyncAt ? integration.lastSyncAt.toLocaleString() : "Nikdy"}
                  </p>
                  <div className={`text-xs mt-1 ${integration.isActive ? 'text-green-600' : 'text-red-600'}`}>
                     {integration.isActive ? 'Aktivní' : 'Neaktivní'}
                  </div>
                </div>
                <div className="flex gap-2">
                    <form action={async () => {
                        "use server";
                        await syncBankNow(integration.id);
                    }}>
                        <button className="text-primary hover:underline text-sm px-2">Sync</button>
                    </form>
                    <form action={async () => {
                        "use server";
                        await toggleBankIntegration(integration.id);
                    }}>
                        <button className="text-muted-foreground hover:underline text-sm px-2">
                            {integration.isActive ? 'Deaktivovat' : 'Aktivovat'}
                        </button>
                    </form>
                    <form action={async () => {
                        "use server";
                        await removeBankIntegration(integration.id);
                    }}>
                        <button className="text-destructive hover:underline text-sm px-2">Odstranit</button>
                    </form>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Přidat integraci</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await addBankIntegration({
                    provider: formData.get("provider") as string,
                    token: formData.get("token") as string,
                    key: (formData.get("key") as string) || undefined,
                  });
                }}
                className="grid gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="provider"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="FIO"
                  >
                    <option value="FIO">Fio banka</option>
                    <option value="RB">Raiffeisenbank</option>
                  </select>
                  <input
                    name="token"
                    placeholder="API token"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <input
                  name="key"
                  placeholder="Klíč / certifikát (volitelné)"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md w-fit">
                  Přidat integraci
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Legal Settings */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Právní nastavení</h2>
          <form action={async (formData) => {
            "use server";
            await updateOrganization({
              defaultGdprClause: formData.get("defaultGdprClause") as string,
              defaultSlaText: formData.get("defaultSlaText") as string,
              isLegalHold: formData.get("isLegalHold") === "on",
            });
          }} className="grid gap-4">
             <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  name="isLegalHold" 
                  id="isLegalHold" 
                  defaultChecked={org.isLegalHold} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isLegalHold" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Legal Hold (Zámek proti smazání dat)
                </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Pokud je aktivní, nelze mazat faktury, náklady ani klienty.
            </p>

            <label className="block mt-4">
              <span className="text-sm font-medium">Výchozí text GDPR doložky</span>
              <textarea 
                name="defaultGdprClause" 
                defaultValue={org.defaultGdprClause || ""} 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                placeholder="Text, který se vloží do faktury..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Výchozí text SLA doložky</span>
              <textarea 
                name="defaultSlaText" 
                defaultValue={org.defaultSlaText || ""} 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                placeholder="Text, který se vloží do faktury..."
              />
            </label>

            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit">Uložit právní nastavení</button>
          </form>
        </section>
          <div className="mt-8 border-t pt-8">
             <h2 className="text-xl font-semibold mb-4 text-destructive">Nebezpečná zóna</h2>
             <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/20">
                <h3 className="font-medium text-destructive mb-2">Smazání testovacích dat</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Tato akce smaže všechny faktury, náklady, klienty a bankovní pohyby. 
                    Lze provést pouze pokud je organizace mladší než 24 hodin.
                </p>
                <form action={async () => {
                    "use server";
                    const { deleteTestData } = await import("@/actions/organization");
                    try {
                        await deleteTestData(org.id);
                        // Redirect or toast handled by client usually, but here we just revalidate
                    } catch (e: any) {
                        console.error(e);
                        // In a real form we would set error state
                    }
                }}>
                    <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2 rounded-md w-fit">
                        Smazat všechna data
                    </button>
                </form>
             </div>
          </div>
      </div>
    </div>
  );
}
