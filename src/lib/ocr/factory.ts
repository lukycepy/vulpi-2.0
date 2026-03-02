import { MockOCRProvider } from "@/lib/ocr/mock-provider";
import { OpenAIOCRProvider } from "@/lib/ocr/openai-provider";
import { GeminiOCRProvider } from "@/lib/ocr/gemini-provider";
import { OCRProvider } from "@/lib/ocr/types";

// Factory to get the correct provider
export function getOcrProvider(): OCRProvider {
  const providerType = process.env.OCR_PROVIDER;
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Prefer Gemini if key is present (it's free/cheaper)
  if (geminiKey) {
    return new GeminiOCRProvider(geminiKey);
  }

  if (providerType === "openai" && openAiKey) {
    return new OpenAIOCRProvider(openAiKey);
  }

  // Default to mock
  return new MockOCRProvider();
}
