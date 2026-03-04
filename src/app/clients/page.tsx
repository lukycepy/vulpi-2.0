import { getClients, getClientTags } from "@/actions/client";
import ClientList from "@/components/clients/ClientList";
import NewClientForm from "@/components/clients/NewClientForm";
import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [clients, availableTags] = await Promise.all([
    getClients(),
    getClientTags()
  ]);

  // Transform data for Client Component to avoid Date serialization issues
  const serializedClients = clients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    taxId: client.taxId,
    vatId: client.vatId,
    tags: client.tags.map((tag) => ({ ...tag, color: tag.color ?? "#64748b" })),
    contacts: client.contacts,
    stats: client.stats
  }));

  const serializedTags = availableTags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color ?? "#64748b"
  }));

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Klienti</h1>
        <NewClientForm availableTags={serializedTags} />
      </div>

      <ClientList 
        clients={serializedClients} 
        availableTags={serializedTags} 
      />
    </div>
  );
}
