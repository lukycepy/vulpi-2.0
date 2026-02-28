import { prisma } from "@/lib/prisma";
import { decryptString } from "@/lib/crypto";
import { fetchFioMovements } from "@/services/bank/fio";
import { fetchRbMovements } from "@/services/bank/rb";

function toFioDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function syncBankMovements(orgId?: string) {
  const whereClause: any = { isActive: true };
  if (orgId) {
    whereClause.organizationId = orgId;
  }

  const integrations = await prisma.bankIntegration.findMany({
    where: whereClause,
  });

  const results: Array<{ id: string; provider: string; imported: number; error?: string }> = [];

  for (const integration of integrations) {
    const dateTo = new Date();
    const dateFrom = integration.lastSyncAt ? new Date(integration.lastSyncAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    dateFrom.setDate(dateFrom.getDate() - 1);

    const fromStr = toFioDate(dateFrom);
    const toStr = toFioDate(dateTo);

    try {
      const token = decryptString(integration.encryptedToken);
      const key = integration.encryptedKey ? decryptString(integration.encryptedKey) : null;

      const fetched =
        integration.provider === "FIO"
          ? await fetchFioMovements(token, fromStr, toStr)
          : integration.provider === "RB"
            ? await fetchRbMovements(token, fromStr, toStr)
            : [];

      const existing = await prisma.bankMovement.findMany({
        where: {
          bankIntegrationId: integration.id,
          date: { gte: dateFrom, lte: dateTo },
        },
        select: { transactionId: true },
      });
      const existingIds = new Set(existing.map((m) => m.transactionId));

      let imported = 0;
      for (const movement of fetched) {
        if (!movement.transactionId) continue;
        if (existingIds.has(movement.transactionId)) continue;

        await prisma.bankMovement.create({
          data: {
            bankIntegrationId: integration.id,
            transactionId: movement.transactionId,
            amount: movement.amount ?? 0,
            currency: movement.currency ?? "CZK",
            date: movement.date ?? new Date(),
            variableSymbol: movement.variableSymbol ?? null,
            constantSymbol: movement.constantSymbol ?? null,
            specificSymbol: movement.specificSymbol ?? null,
            accountName: movement.accountName ?? null,
            accountInfo: movement.accountInfo ?? null,
            message: movement.message ?? null,
            status: "UNMATCHED",
          },
        });

        imported++;
      }

      await prisma.bankIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      results.push({ id: integration.id, provider: integration.provider, imported });
      void key;
    } catch (e) {
      results.push({ id: integration.id, provider: integration.provider, imported: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return results;
}
