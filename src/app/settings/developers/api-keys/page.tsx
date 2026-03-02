import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ApiKeyManager } from "@/components/developers/ApiKeyManager";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) redirect("/dashboard");

  // @ts-ignore - Prisma types might be out of sync
  const apiKeys = await prisma.apiKey.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      // We don't select keyHash for security
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">API Klíče</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte přístupové klíče pro API. Klíče uchovávejte v tajnosti.
          </p>
        </div>
      </div>

      <ApiKeyManager initialApiKeys={apiKeys} />
    </div>
  );
}
