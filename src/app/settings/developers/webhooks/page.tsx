import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WebhookManager } from "@/components/developers/WebhookManager";

export default async function WebhooksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) redirect("/dashboard");

  // @ts-ignore - Prisma types might be out of sync
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { logs: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Webhooky</h2>
          <p className="text-sm text-muted-foreground">
            Nastavte si notifikace o událostech ve Vulpi na váš server.
          </p>
        </div>
      </div>

      <WebhookManager initialWebhooks={webhooks} />
    </div>
  );
}
