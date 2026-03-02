import { getClientFromToken } from "@/actions/portal";
import { redirect } from "next/navigation";
import PortalHeader from "@/components/portal/PortalHeader";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const client = await getClientFromToken();
  
  if (!client) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PortalHeader 
        clientName={client.name} 
        clientLogo={client.logoUrl}
        organization={{
          name: client.organization.name,
          logoUrl: client.organization.logoUrl,
          primaryColor: client.organization.primaryColor,
          secondaryColor: client.organization.secondaryColor
        }}
      />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
