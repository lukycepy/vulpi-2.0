"use server";

import { getOcrProvider } from "@/lib/ocr/factory";
import { OCRResult } from "@/lib/ocr/types";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

export type { OCRResult } from "@/lib/ocr/types";

export async function processReceipt(formData: FormData): Promise<OCRResult> {
  const user = await getCurrentUser(); // Ensure user is authenticated
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");

  const file = formData.get("file") as File;
  
  if (!file) {
    throw new Error("No file uploaded");
  }

  try {
    const provider = getOcrProvider();
    const result = await provider.processReceipt(file);
    return result;
  } catch (error) {
    console.error("OCR Processing Error:", error);
    // Fallback to mock in case of error if desired, or rethrow
    // For now, let's just rethrow to show error in UI
    throw new Error("Failed to process receipt via OCR service.");
  }
}
