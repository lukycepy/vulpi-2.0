"use server";

import { MockOCRProvider } from "@/lib/ocr/mock-provider";
import { OpenAIOCRProvider } from "@/lib/ocr/openai-provider";
import { OCRProvider, OCRResult } from "@/lib/ocr/types";
import { getCurrentUser } from "@/lib/auth-permissions";

export type { OCRResult } from "@/lib/ocr/types";

// Factory to get the correct provider
function getOcrProvider(): OCRProvider {
  const providerType = process.env.OCR_PROVIDER || "mock";
  const apiKey = process.env.OPENAI_API_KEY;

  if (providerType === "openai" && apiKey) {
    return new OpenAIOCRProvider(apiKey);
  }

  // Default to mock
  return new MockOCRProvider();
}

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
