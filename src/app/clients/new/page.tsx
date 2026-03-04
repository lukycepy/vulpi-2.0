import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Nový klient</h1>
      <ClientForm />
    </div>
  );
}