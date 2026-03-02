import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/services/email";
import { triggerWebhook, sendNotificationWebhook } from "@/services/webhook";

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
        include: { organization: true, client: true }
      });

      if (invoice && invoice.currency === movement.currency) {
        const currentPaid = invoice.paidAmount || 0;
        const newPaidAmount = currentPaid + movement.amount;
        const remaining = invoice.totalAmount - newPaidAmount;

        // Overpayment (paid more than total)
        if (remaining <= -0.01) {
           const overpayment = Math.abs(remaining);
           await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoice.id },
              data: { 
                status: "PAID", 
                paidAmount: newPaidAmount,
                overpaymentAmount: 0
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
            await sendPaymentConfirmationEmail(invoice.id, movement.amount);
          } catch (e) {
            console.error(`Failed to send confirmation email for invoice ${invoice.id}`, e);
          }

          // Trigger Webhook
          try {
            await triggerWebhook(invoice.organizationId, "INVOICE_PAID", {
              id: invoice.id,
              number: invoice.number,
              variableSymbol: invoice.variableSymbol,
              totalAmount: invoice.totalAmount,
              paidAmount: newPaidAmount,
              status: "PAID",
              currency: invoice.currency
            });

            // Custom Notification Webhook
            if (invoice.organization.notificationWebhookUrl) {
                const message = `💰 Faktura #${invoice.number} od klienta ${invoice.client.name} byla právě uhrazena!`;
                await sendNotificationWebhook(invoice.organization.notificationWebhookUrl, message);
            }
          } catch (e) {
             console.error(`Failed to trigger webhook for invoice ${invoice.id}`, e);
          }
          
          matchedCount++;
          continue;
        }

        // Exact Payment
        if (Math.abs(remaining) < 0.01) {
           await prisma.$transaction([
            prisma.invoice.update({
              where: { id: invoice.id },
              data: { 
                status: "PAID", 
                paidAmount: newPaidAmount,
                overpaymentAmount: 0
              } as any,
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
            await sendPaymentConfirmationEmail(invoice.id, movement.amount);
          } catch (e) {
            console.error(`Failed to send confirmation email for invoice ${invoice.id}`, e);
          }

          try {
            await triggerWebhook(invoice.organizationId, "INVOICE_PAID", {
              ...invoice,
              status: "PAID",
              paidAmount: newPaidAmount,
              overpaymentAmount: 0
            });

            // Custom Notification Webhook
            if (invoice.organization.notificationWebhookUrl) {
                const message = `💰 Faktura #${invoice.number} od klienta ${invoice.client.name} byla právě uhrazena!`;
                await sendNotificationWebhook(invoice.organization.notificationWebhookUrl, message);
            }
          } catch (e) {
            console.error(`Failed to trigger webhook for invoice ${invoice.id}`, e);
          }
          
          matchedCount++;
          continue;
        } 
        
        // Partial Payment
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
    const amountMatches = candidates.filter((c: any) => {
        const remaining = c.totalAmount - (c.paidAmount || 0);
        return Math.abs(remaining - movement.amount) < 0.01;
    });

    if (amountMatches.length === 0) continue;

    // Refine candidates by Client Name if available
    let bestCandidates = amountMatches;
    if (movement.accountName) {
        const nameMatches = amountMatches.filter((c: any) => 
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
        },
      });
      continue;
    }

    if (bestCandidates.length > 1) {
      await prisma.bankMovement.update({
        where: { id: movement.id },
        data: {
          status: "PROPOSED_MULTI",
        },
      });
    }
  }

  return matchedCount;
}
