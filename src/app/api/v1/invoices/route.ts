import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-auth";
import { z } from "zod";

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  currency: z.string().default("CZK"),
  items: z.array(z.object({
    description: z.string(),
    amount: z.number(),
    quantity: z.number().default(1),
    vatRate: z.number().default(0)
  }))
});

export async function GET(req: Request) {
  try {
    const organization = await verifyApiKey(req);
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {
      organizationId: organization.id
    };

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        client: {
          select: { name: true, taxId: true }
        }
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const organization = await verifyApiKey(req);
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body", details: result.error.issues }, { status: 400 });
    }

    const { clientId, currency, items } = result.data;

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: organization.id }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate totals
    let totalAmount = 0;
    let vatAmount = 0;

    const invoiceItems = items.map(item => {
      const itemTotal = item.amount * item.quantity;
      const itemVat = itemTotal * (item.vatRate / 100);
      
      totalAmount += itemTotal + itemVat;
      vatAmount += itemVat;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.amount,
        vatRate: item.vatRate,
        totalAmount: itemTotal + itemVat
      };
    });

    // Generate invoice number (simplified logic for API)
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" }
    });

    const currentYear = new Date().getFullYear();
    let number = `${currentYear}001`;

    if (lastInvoice && lastInvoice.number.startsWith(currentYear.toString())) {
      const sequence = parseInt(lastInvoice.number.slice(4)) + 1;
      number = `${currentYear}${sequence.toString().padStart(3, "0")}`;
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: organization.id,
        clientId,
        number,
        type: "FAKTURA",
        variableSymbol: number,
        status: "DRAFT", // API creates DRAFT by default
        currency,
        totalAmount,
        totalVat: vatAmount,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        items: {
          create: invoiceItems
        }
      },
      include: {
        items: true,
        client: true
      }
    });

    return NextResponse.json(invoice, { status: 201 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
