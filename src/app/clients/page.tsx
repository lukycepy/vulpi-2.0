import { prisma } from "@/lib/prisma";
import NewClientForm from "@/components/clients/NewClientForm";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }
  
  const orgId = membership.organizationId;
  const canManageClients = await hasPermission(user.id, orgId, "manage_clients");

  if (!canManageClients) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění pro správu klientů.
        </div>
      </div>
    );
  }

  const clients = await prisma.client.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Klienti</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {clients.length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg text-muted-foreground">
              Zatím nemáte žádné klienty.
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="p-4 border rounded-lg bg-card shadow-sm flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    {client.taxId && <span>IČ: {client.taxId}</span>}
                    {client.vatId && <span>DIČ: {client.vatId}</span>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{client.email}</div>
                  <div>{client.phone}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <NewClientForm />
        </div>
      </div>
    </div>
  );
}
