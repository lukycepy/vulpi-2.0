"use server";

import { getOcrProvider } from "@/lib/ocr/factory";
import { OCRResult } from "@/lib/ocr/types";
import { getCurrentUser } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import { fetchAresData } from "@/actions/ares"; // Import ARES action

export type { OCRResult } from "@/lib/ocr/types";

export async function processReceipt(formData: FormData): Promise<OCRResult> {
  const user = await getCurrentUser();
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
    
    // ARES Validation
    if (result.ico) {
        try {
            const aresData = await fetchAresData(result.ico);
            if (aresData) {
                // Enrich result with ARES data
                result.supplierName = aresData.name || result.supplierName;
                // You might want to return address too if OCRResult supports it
                // result.address = aresData.address; 
            }
        } catch (e) {
            console.warn("ARES validation failed during OCR", e);
        }
    }

    return result;
  } catch (error: any) {
    console.error("OCR Processing Error Full:", error);
    // Return a more specific error message if available
    const errorMessage = error.message || "Unknown error";
    throw new Error(`Failed to process receipt via OCR service: ${errorMessage}`);
  }
}
