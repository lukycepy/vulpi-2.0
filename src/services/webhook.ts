
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

export async function sendNotificationWebhook(webhookUrl: string, message: string) {
    if (!webhookUrl) return;
    
    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message })
        });
    } catch (err) {
        console.error("Failed to send custom notification webhook:", err);
    }
}

export async function triggerWebhook(organizationId: string, eventType: string, payload: any) {
    try {
        // 1. Find active webhooks for this organization that subscribe to this event
        const webhooks = await prisma.webhook.findMany({
            where: {
                organizationId,
                isActive: true,
                // Simple string check for now. Ideally should parse JSON/Array
                eventTypes: { contains: eventType } 
            }
        });

        if (webhooks.length === 0) return;

        // 2. Prepare payload wrapper
        const fullPayload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload
        };
        const payloadString = JSON.stringify(fullPayload);

        // 3. Send to all targets (fire and forget / parallel)
        await Promise.all(webhooks.map(async (webhook) => {
            // Verify if the comma-separated list actually contains the event (to avoid partial matches like "INVOICE_PAID_PARTIAL" matching "INVOICE_PAID")
            const events = webhook.eventTypes.split(",").map(e => e.trim());
            if (!events.includes(eventType)) return;

            let status = 0;
            let responseBody = null;

            try {
                const signature = webhook.secretKey 
                    ? createHmac('sha256', webhook.secretKey).update(payloadString).digest('hex')
                    : "";

                const res = await fetch(webhook.targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Vulpi-Signature": signature,
                        "X-Vulpi-Event": eventType
                    },
                    body: payloadString
                });

                status = res.status;
                const text = await res.text();
                responseBody = text.substring(0, 1000); // Limit log size

            } catch (e: any) {
                status = 500;
                responseBody = e.message;
            }

            // 4. Log the result
            await prisma.webhookLog.create({
                data: {
                    webhookId: webhook.id,
                    event: eventType,
                    requestPayload: payloadString,
                    responseStatusCode: status,
                    responseBody: responseBody
                }
            });
        }));

    } catch (e) {
        console.error("Failed to trigger webhooks:", e);
    }
}
