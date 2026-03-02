
import { prisma } from "@/lib/prisma";
import { sendAnniversaryEmail } from "@/services/email";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // getMonth is 0-indexed

  try {
    // Note: SQLite doesn't have DAY() or MONTH() functions easily accessible via Prisma query API in a standard way
    // without using raw query or fetching all and filtering.
    // However, Prisma client allows filtering if we had stored day and month separately, but we have a DateTime.
    // For small datasets, fetching all clients with establishedDate is fine. 
    // For larger ones, raw query is better. Let's use raw query for efficiency.

    const clients = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Client" 
      WHERE "establishedDate" IS NOT NULL 
      AND strftime('%d', "establishedDate") = ${day.toString().padStart(2, '0')}
      AND strftime('%m', "establishedDate") = ${month.toString().padStart(2, '0')}
    `;

    const results = [];

    for (const client of clients) {
      // Calculate years
      const established = new Date(client.establishedDate);
      const years = today.getFullYear() - established.getFullYear();

      if (years > 0) {
         await sendAnniversaryEmail(client.id, years);
         results.push({ id: client.id, name: client.name, years });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error("Anniversary cron failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
