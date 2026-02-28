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
            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit">Uložit změny</button>
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
                  {bank.iban && <p className="text-xs text-muted-foreground">IBAN: {bank.iban}</p>}
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
                  currency: formData.get("currency") as string,
                });
              }} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="bankName" placeholder="Název banky" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                  <input name="accountNumber" placeholder="Číslo účtu" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input name="iban" placeholder="IBAN" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
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

        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Bankovní integrace</h2>
            <form
              action={async () => {
                "use server";
                await syncBankNow();
              }}
            >
              <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md w-fit">
                Synchronizovat nyní
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {org.bankIntegrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{integration.provider}</p>
                  <p className="text-sm text-muted-foreground">
                    Aktivní: {integration.isActive ? "Ano" : "Ne"}{integration.lastSyncAt ? ` · Poslední sync: ${integration.lastSyncAt.toLocaleString("cs-CZ")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <form
                    action={async () => {
                      "use server";
                      await toggleBankIntegration(integration.id, !integration.isActive);
                    }}
                  >
                    <button className="text-sm hover:underline">{integration.isActive ? "Vypnout" : "Zapnout"}</button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await removeBankIntegration(integration.id);
                    }}
                  >
                    <button className="text-destructive hover:underline text-sm">Odstranit</button>
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
      </div>
    </div>
  );
}
