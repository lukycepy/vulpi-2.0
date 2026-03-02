
"use server";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Delete old AuditLogs
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    // 2. Delete orphaned WebhookLogs (e.g. older than 30 days)
    // @ts-ignore - Prisma types might be out of sync
    const deletedWebhookLogs = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    // 3. Delete orphaned Attachments
    // Find attachments where invoiceId does not exist (if ON DELETE CASCADE is not working or files are uploaded without invoice)
    // Actually, Prisma schema has ON DELETE CASCADE for Attachment -> Invoice. 
    // So if invoice is deleted, attachment record is deleted.
    // But we might have files in storage that are not in DB, or DB records pointing to non-existent files.
    // Here we focus on DB cleanup. 
    // If we want to find attachments that are not linked to any invoice (if relation was optional, but it is required in schema).
    // Let's assume we want to clean up attachments of CANCELLED invoices older than 1 year? No, that's business logic.
    // Let's stick to cleaning up temp data or logs.
    
    // Maybe EmailLogs?
    const deletedEmailLogs = await prisma.emailLog.deleteMany({
      where: {
        sentAt: { lt: thirtyDaysAgo }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: {
        auditLogs: deletedAuditLogs.count,
        webhookLogs: deletedWebhookLogs.count,
        emailLogs: deletedEmailLogs.count
      }
    });
  } catch (error: any) {
    console.error("Maintenance cron failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
