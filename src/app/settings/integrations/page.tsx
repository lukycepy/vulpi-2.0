
import { prisma } from "@/lib/prisma";
import { updateOrganization } from "@/actions/organization";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export default async function IntegrationsSettings() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) return <div>Organization not found. Please register first.</div>;

  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
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
      <h1 className="text-3xl font-bold mb-6">Integrace</h1>
      
      <div className="grid gap-8">
        
        {/* Cloud Storage */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Cloudová úložiště</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Automaticky odesílat vygenerované PDF faktury do zvolených cloudových služeb.
            (V této verzi se jedná o simulaci integrace)
          </p>
          
          <form action={async (formData) => {
            "use server";
            await updateOrganization({
              cloudIntegrationGoogleDrive: formData.get("cloudIntegrationGoogleDrive") === "on",
              cloudIntegrationDropbox: formData.get("cloudIntegrationDropbox") === "on",
              cloudIntegrationOneDrive: formData.get("cloudIntegrationOneDrive") === "on",
            });
          }} className="space-y-4">
            
            <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
              <input 
                type="checkbox" 
                name="cloudIntegrationGoogleDrive" 
                id="cloudIntegrationGoogleDrive" 
                // @ts-ignore - Prisma types might be out of sync
                defaultChecked={org.cloudIntegrationGoogleDrive} 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <label htmlFor="cloudIntegrationGoogleDrive" className="text-sm font-medium leading-none cursor-pointer">
                  Google Drive
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
              <input 
                type="checkbox" 
                name="cloudIntegrationDropbox" 
                id="cloudIntegrationDropbox" 
                // @ts-ignore - Prisma types might be out of sync
                defaultChecked={org.cloudIntegrationDropbox} 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <label htmlFor="cloudIntegrationDropbox" className="text-sm font-medium leading-none cursor-pointer">
                  Dropbox
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
              <input 
                type="checkbox" 
                name="cloudIntegrationOneDrive" 
                id="cloudIntegrationOneDrive" 
                // @ts-ignore - Prisma types might be out of sync
                defaultChecked={org.cloudIntegrationOneDrive} 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <label htmlFor="cloudIntegrationOneDrive" className="text-sm font-medium leading-none cursor-pointer">
                  OneDrive
                </label>
              </div>
            </div>

            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit mt-2">
              Uložit nastavení cloudu
            </button>
          </form>
        </section>

        {/* Google Calendar */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Kalendář</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Integrace s kalendářem pro sledování splatnosti faktur.
          </p>

          <form action={async (formData) => {
            "use server";
            await updateOrganization({
              googleCalendarIntegration: formData.get("googleCalendarIntegration") === "on",
            });
          }} className="space-y-4">
            
            <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
              <input 
                type="checkbox" 
                name="googleCalendarIntegration" 
                id="googleCalendarIntegration" 
                // @ts-ignore - Prisma types might be out of sync
                defaultChecked={org.googleCalendarIntegration} 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <label htmlFor="googleCalendarIntegration" className="text-sm font-medium leading-none cursor-pointer">
                  Google Kalendář
                </label>
                <p className="text-xs text-muted-foreground">
                    Synchronizovat data splatnosti faktur do Google Kalendáře
                </p>
              </div>
            </div>

            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit mt-2">
              Uložit nastavení kalendáře
            </button>
          </form>
        </section>

        {/* Notification Webhooks */}
        <section className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Notifikace (Webhooks)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Odesílání notifikací do komunikačních nástrojů (Slack, Discord) při důležitých událostech (např. uhrazení faktury).
          </p>

          <form action={async (formData) => {
            "use server";
            await updateOrganization({
              notificationWebhookUrl: formData.get("notificationWebhookUrl") as string,
            });
          }} className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="notificationWebhookUrl" className="text-sm font-medium">
                URL Webhooku
              </label>
              <input 
                type="url" 
                name="notificationWebhookUrl" 
                id="notificationWebhookUrl" 
                // @ts-ignore - Prisma types might be out of sync
                defaultValue={org.notificationWebhookUrl || ""} 
                placeholder="https://example.com/webhook"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                URL, na kterou budeme posílat notifikace o událostech (např. zaplacení faktury).
              </p>
            </div>

            <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md w-fit mt-2">
              Uložit nastavení notifikací
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
