
"use server";

import { getOcrProvider } from "@/lib/ocr/factory";

export async function analyzeSentiment(text: string): Promise<{ sentiment: "ANGRY" | "NEUTRAL" | "HAPPY", score: number }> {
  // Mock implementation for now
  // In a real app, this would call OpenAI or another AI service
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowerText = text.toLowerCase();
  
  // Simple heuristic keywords
  if (lowerText.includes("špatn") || 
      lowerText.includes("chyb") || 
      lowerText.includes("nesouhlas") || 
      lowerText.includes("reklam") || 
      lowerText.includes("!")) {
    return { sentiment: "ANGRY", score: 0.1 };
  } else if (lowerText.includes("děkuj") || 
             lowerText.includes("skvěl") || 
             lowerText.includes("super") || 
             lowerText.includes("spokojen")) {
    return { sentiment: "HAPPY", score: 0.9 };
  }
  
  return { sentiment: "NEUTRAL", score: 0.5 };
}

export async function generateInvoiceDescription(input: string): Promise<string> {
    try {
        const provider = getOcrProvider();
        return await provider.analyzeInvoiceText(input);
    } catch (error) {
        console.error("Failed to generate description:", error);
        // Fallback to basic if provider fails
        return input;
    }
}
