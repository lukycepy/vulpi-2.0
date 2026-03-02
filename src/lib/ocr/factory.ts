import { MockOCRProvider } from "@/lib/ocr/mock-provider";
import { OpenAIOCRProvider } from "@/lib/ocr/openai-provider";
import { OCRProvider } from "@/lib/ocr/types";

// Factory to get the correct provider
export function getOcrProvider(): OCRProvider {
  const providerType = process.env.OCR_PROVIDER || "mock";
  const apiKey = process.env.OPENAI_API_KEY;

  if (providerType === "openai" && apiKey) {
    return new OpenAIOCRProvider(apiKey);
  }

  // Default to mock
  return new MockOCRProvider();
}
