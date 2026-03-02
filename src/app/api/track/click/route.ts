
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const emailLogId = searchParams.get("emailLogId");

  if (!url) {
    return new NextResponse("Missing URL", { status: 400 });
  }

  // Record click if emailLogId is present
  if (emailLogId) {
    try {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "OPENED", // Clicking implies opening
          clickedAt: new Date(),
          clickCount: { increment: 1 }
        }
      });
    } catch (e) {
      console.error(`Failed to log click for emailLog ${emailLogId}:`, e);
    }
  }

  // Redirect to target URL
  return NextResponse.redirect(url);
}
