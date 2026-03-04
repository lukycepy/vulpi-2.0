
import { prisma } from "@/lib/prisma";
import {
  addBankDetail,
  removeBankDetail,
} from "@/actions/organization";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { OrganizationSettingsForm } from "@/components/settings/OrganizationSettingsForm";

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

  return (
    <div className="container mx-auto p-6 max-w-4xl pb-24">
      <OrganizationSettingsForm org={org} canManageSettings={canManageSettings} />

      {/* Bank Accounts - Separate section as it handles list logic */}
      {canManageSettings && (
        <section className="bg-card p-6 rounded-lg border shadow-sm mt-8">
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
      )}
    </div>
  );
}
