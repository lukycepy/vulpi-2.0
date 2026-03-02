
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id) {
    try {
      // Find the email log first
      const emailLog = await prisma.emailLog.findUnique({
        where: { id },
      });

      if (emailLog && emailLog.status !== "OPENED") {
        await prisma.emailLog.update({
          where: { id },
          data: {
            status: "OPENED",
            openedAt: new Date(),
          },
        });
      } else if (emailLog && !emailLog.openedAt) {
        // Just in case status is something else but openedAt is missing
        await prisma.emailLog.update({
          where: { id },
          data: {
            openedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error tracking email open:", error);
    }
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
