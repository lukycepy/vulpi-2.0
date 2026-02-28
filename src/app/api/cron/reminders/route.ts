
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/services/email";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Ensure this runs dynamically

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Helper to get range for a specific date
    const getDayRange = (date: Date) => {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      return { start, end };
    };

    // 1. Pre-reminder: 2 days BEFORE due date (dueAt = today + 2)
    const preDate = new Date(today);
    preDate.setDate(today.getDate() + 2);
    const preRange = getDayRange(preDate);

    // 2. 1st reminder: 1 day AFTER due date (dueAt = today - 1)
    const firstDate = new Date(today);
    firstDate.setDate(today.getDate() - 1);
    const firstRange = getDayRange(firstDate);

    // 3. 2nd reminder: 7 days AFTER due date (dueAt = today - 7)
    const secondDate = new Date(today);
    secondDate.setDate(today.getDate() - 7);
    const secondRange = getDayRange(secondDate);

    // Fetch invoices that match any of these due dates
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "ISSUED", // Only issued invoices
        OR: [
          { dueAt: { gte: preRange.start, lte: preRange.end } },
          { dueAt: { gte: firstRange.start, lte: firstRange.end } },
          { dueAt: { gte: secondRange.start, lte: secondRange.end } },
        ]
      },
      include: {
        client: true,
        organization: true
      }
    });

    const results = {
      pre: 0,
      first: 0,
      second: 0,
      errors: 0,
      skipped: 0
    };

    for (const invoice of invoices) {
      const due = new Date(invoice.dueAt);
      due.setHours(0,0,0,0);
      
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      // diffDays = 0 means today is due date
      // diffDays = -2 means due date is in 2 days (today - due = -2) -> Pre-reminder
      // diffDays = 1 means due date was yesterday (today - due = 1) -> 1st reminder
      // diffDays = 7 means due date was 7 days ago -> 2nd reminder
      
      // Check if we already sent a reminder of this type TODAY
      const alreadySent = await prisma.emailLog.findFirst({
        where: {
            invoiceId: invoice.id,
            body: { contains: `Overdue: ${diffDays} days` },
            sentAt: {
                gte: today
            }
        }
      });

      if (alreadySent) {
          results.skipped++;
          continue;
      }

      try {
        if (diffDays === -2) {
            // Pre-reminder
            await sendReminderEmail(invoice.id, -2);
            results.pre++;
        } else if (diffDays === 1) {
            // 1st reminder
            await sendReminderEmail(invoice.id, 1);
            results.first++;
        } else if (diffDays === 7) {
            // 2nd reminder
            await sendReminderEmail(invoice.id, 7);
            results.second++;
        }
      } catch (e) {
        console.error(`Failed to process invoice ${invoice.id}`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron job failed", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
