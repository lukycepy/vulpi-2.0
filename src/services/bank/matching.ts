import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/services/email";

export async function matchPayments(orgId?: string) {
  const whereClause: any = { status: "UNMATCHED" };
  if (orgId) {
    whereClause.bankIntegration = { organizationId: orgId };
  }

  const movements = await prisma.bankMovement.findMany({
    where: whereClause,
    include: { bankIntegration: true },
  });

  let matchedCount = 0;

  for (const movement of movements) {
    if (movement.amount <= 0) {
      await prisma.bankMovement.update({
        where: { id: movement.id },
        data: { status: "IGNORED" },
      });
      continue;
    }

    // 1. Try to find by Variable Symbol (Exact Match)
    if (movement.variableSymbol) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          variableSymbol: movement.variableSymbol,
          status: { in: ["ISSUED", "PARTIAL"] },
        },
      });

      if (invoice && invoice.currency === movement.currency) {
        const currentPaid = invoice.paidAmount || 0;
        const newPaidAmount = currentPaid + movement.amount;
        const remaining = invoice.totalAmount - newPaidAmount;

        // Fully Paid (within small tolerance)
        if (remaining < 0.01) {
           await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoice.id },
              data: { 
                status: "PAID", 
                paidAmount: newPaidAmount 
              },
            }),
            prisma.bankMovement.update({
              where: { id: movement.id },
              data: {
                status: "MATCHED",
                invoiceId: invoice.id,
              },
            }),
          ]);

          try {
            await sendPaymentConfirmationEmail(invoice.id);
          } catch (e) {
            console.error(`Failed to send confirmation email for invoice ${invoice.id}`, e);
          }
          
          matchedCount++;
          continue;
        } 
        
        // Partial Payment (or Overpayment handled simply as PAID if remaining < 0)
        // If remaining is positive, it's PARTIAL.
        // If remaining is negative (overpaid), we still mark as PAID but track full amount?
        // Let's handle overpayment separately if needed, but for now:
        
        if (remaining > 0.01) {
           await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoice.id },
              data: { 
                status: "PARTIAL", 
                paidAmount: newPaidAmount 
              },
            }),
            prisma.bankMovement.update({
              where: { id: movement.id },
              data: {
                status: "MATCHED",
                invoiceId: invoice.id,
                message: "Částečná úhrada",
              },
            }),
          ]);
          matchedCount++;
          continue;
        }
      }
    }

    // 2. Advanced Matching (No VS or VS not found)
    // Find candidates by amount and date
    const from = new Date(movement.date);
    from.setDate(from.getDate() - 60);
    const to = new Date(movement.date);
    to.setDate(to.getDate() + 60);

    // Fetch all potential candidates
    const candidates = await prisma.invoice.findMany({
      where: {
        status: { in: ["ISSUED", "PARTIAL"] },
        currency: movement.currency,
        issuedAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        client: true,
      },
    });

    // Filter by amount (remaining amount matches movement amount)
    const amountMatches = candidates.filter(c => {
        const remaining = c.totalAmount - (c.paidAmount || 0);
        return Math.abs(remaining - movement.amount) < 0.01;
    });

    if (amountMatches.length === 0) continue;

    // Refine candidates by Client Name if available
    let bestCandidates = amountMatches;
    if (movement.accountName) {
        const nameMatches = amountMatches.filter(c => 
            (c.client.name && movement.accountName && c.client.name.toLowerCase().includes(movement.accountName.toLowerCase())) ||
            (movement.accountName && c.client.name && movement.accountName.toLowerCase().includes(c.client.name.toLowerCase()))
        );
        if (nameMatches.length > 0) {
            bestCandidates = nameMatches;
        }
    }

    if (bestCandidates.length === 1) {
      await prisma.bankMovement.update({
        where: { id: movement.id },
        data: {
          status: "PROPOSED",
          invoiceId: bestCandidates[0].id,
          message: movement.accountName ? "Shoda částky a jména" : "Shoda částky",
        },
      });
      continue;
    }

    if (bestCandidates.length > 1) {
      await prisma.bankMovement.update({
        where: { id: movement.id },
        data: {
          status: "PROPOSED_MULTI",
          message: `Možní kandidáti: ${bestCandidates.map((c) => c.number).join(", ")}`,
        },
      });
    }
  }

  return matchedCount;
}
