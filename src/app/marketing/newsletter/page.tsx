
import { getClients } from "@/actions/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-permissions";
import { NewsletterForm } from "./NewsletterForm";

export default async function NewsletterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const clients = await getClients();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Newsletter (Hromadné e-maily)</h1>
      <p className="text-muted-foreground mb-6">
        Vyberte klienty a odešlete hromadnou zprávu. Můžete použít tag <code>{"{{clientName}}"}</code> pro vložení jména klienta.
      </p>

      <NewsletterForm clients={clients} />
    </div>
  );
}
