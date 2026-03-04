import { getClient } from "@/actions/client";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function ClientEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  
  if (!client) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Upravit klienta</h1>
      <ClientForm initialData={client} />
    </div>
  );
}