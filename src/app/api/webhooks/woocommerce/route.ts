
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { generateNextInvoiceNumber } from "@/actions/invoice";

// Secret for verifying WooCommerce webhook
// In production, this should be an environment variable per organization
// For now, we assume a single secret for simplicity or fetch from DB if we had a field for it
const WC_WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "vulpi_secret";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-wc-webhook-signature");
    const body = await req.json();
    const rawBody = JSON.stringify(body); // Note: verification usually needs raw body buffer, here we approximate

    // 1. Verify Signature (Simplified)
    // In real scenario, we need the raw buffer for correct hash verification
    if (WC_WEBHOOK_SECRET && signature) {
       // Verification logic here
    }

    // 2. Extract Data
    const { billing, line_items, total, currency, id: orderId } = body;
    
    // We need to identify which organization this webhook belongs to.
    // Usually via query param ?orgId=... or API Key header.
    // Let's assume ?orgId=...
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
        return NextResponse.json({ error: "Missing orgId parameter" }, { status: 400 });
    }

    // 3. Find or Create Client
    const clientEmail = billing.email;
    let client = await prisma.client.findFirst({
        where: { 
            organizationId: orgId,
            email: clientEmail
        }
    });

    if (!client) {
        client = await prisma.client.create({
            data: {
                organizationId: orgId,
                name: `${billing.first_name} ${billing.last_name}`.trim() || "WooCommerce Customer",
                email: clientEmail,
                phone: billing.phone,
                address: billing.address_1,
                city: billing.city,
                zip: billing.postcode,
                country: billing.country
            }
        });
    }

    // 4. Prepare Invoice Items
    const items = line_items.map((item: any) => ({
        description: item.name,
        quantity: item.quantity,
        unit: "ks",
        unitPrice: parseFloat(item.price), // Price per unit excluding tax usually
        vatRate: 21, // Default or extract from tax_lines if needed
        discount: 0,
        totalAmount: parseFloat(item.total), // Line total excluding tax
        sku: item.sku || ""
    }));

    // Add shipping as item if exists
    if (body.shipping_total && parseFloat(body.shipping_total) > 0) {
        items.push({
            description: "Doprava",
            quantity: 1,
            unit: "ks",
            unitPrice: parseFloat(body.shipping_total),
            vatRate: 21,
            discount: 0,
            totalAmount: parseFloat(body.shipping_total),
            sku: "SHIPPING"
        });
    }

    // 5. Generate Invoice Number
    const number = await generateNextInvoiceNumber(orgId);

    // 6. Create Invoice
    // We calculate totalVat roughly here or let the system do it.
    // Simple sum for now.
    const totalAmount = parseFloat(total);
    const totalVat = parseFloat(body.total_tax) || 0;

    await prisma.invoice.create({
        data: {
            organizationId: orgId,
            clientId: client.id,
            number: number,
            type: "FAKTURA",
            status: "ISSUED", // Automatically issued
            issuedAt: new Date(),
            dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
            currency: currency || "CZK",
            totalAmount: totalAmount,
            totalVat: totalVat,
            variableSymbol: orderId.toString(), // Use Order ID as VS
            items: {
                create: items
            }
        }
    });

    return NextResponse.json({ success: true, message: "Invoice created" });

  } catch (error: any) {
    console.error("WooCommerce Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
