
import { prisma } from "@/lib/prisma";
import parser from "cron-parser";
import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/services/email";

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  
  try {
    const recurring = await prisma.recurringInvoice.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: now
        }
      }
    });

    let processed = 0;
    let errors = 0;

    for (const template of recurring) {
      try {
        let data: any;
        try {
            data = JSON.parse(template.invoiceData);
        } catch (e) {
            throw new Error("Invalid JSON in invoiceData");
        }
        
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error("Missing items in template data");
        }

        // Fetch client for due days
        const client = await prisma.client.findUnique({ where: { id: template.clientId } });
        if (!client) throw new Error(`Client ${template.clientId} not found`);

        const dueDays = client.defaultDueDays || 14;
        const dueAt = new Date(now);
        dueAt.setDate(now.getDate() + dueDays);
        
        // Generate Invoice Number (Simple format: R-YYYY-MM-COUNT)
        const count = await prisma.invoice.count();
        const number = `R-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

        // Create Invoice
        const invoice = await prisma.invoice.create({
          data: {
            organizationId: template.organizationId,
            clientId: template.clientId,
            number: number,
            type: "FAKTURA",
            status: "ISSUED",
            issuedAt: now,
            dueAt: dueAt,
            currency: data.currency || "CZK",
            totalAmount: Number(data.totalAmount),
            totalVat: Number(data.totalVat),
            vatMode: data.vatMode || "STANDARD",
            items: {
              create: data.items.map((item: any) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
                totalAmount: Number(item.totalAmount),
                discount: Number(item.discount || 0)
              }))
            },
            bankDetailId: data.bankDetailId, 
            notes: data.notes
          }
        });

        // Update Recurring Template
        const interval = parser.parseExpression(template.cronExpression, { currentDate: now });
        const nextRun = interval.next().toDate();

        await prisma.recurringInvoice.update({
          where: { id: template.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRun
          }
        });

        // Send Email
        try {
            await sendInvoiceEmail(invoice.id);
        } catch (emailError) {
            console.error(`Failed to send email for recurring invoice ${invoice.id}`, emailError);
            // Don't fail the whole process if email fails, but log it.
        }

        processed++;
      } catch (e) {
        console.error(`Error processing recurring invoice ${template.id}:`, e);
        errors++;
      }
    }

    return NextResponse.json({ success: true, processed, errors });
  } catch (error) {
    console.error("Recurring cron failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
