import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (id) {
    try {
      // Find the email log and increment open count
      // This assumes we stored the log ID in the pixel URL
      await prisma.emailLog.update({
        where: { id },
        data: {
          status: "OPENED",
          // clickCount: { increment: 1 } // If we had clickCount
          // Or just update 'openedAt' timestamp if we had one
        }
      });
    } catch (error) {
      console.error("Tracking pixel error:", error);
    }
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}