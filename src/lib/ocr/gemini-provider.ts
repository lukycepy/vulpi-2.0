
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OCRProvider, OCRResult } from "./types";

export class GeminiOCRProvider implements OCRProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private async fileToGenerativePart(file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type || "image/jpeg",
      },
    };
  }

  async processReceipt(file: File | Blob): Promise<OCRResult> {
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type || "image/jpeg",
        },
      };

      const prompt = `
        Analyze this receipt image and extract the following information in strict JSON format.
        Return ONLY valid JSON, no markdown formatting, no code blocks.
        
        Required fields:
        - amount: number (total amount including VAT)
        - currency: string (e.g., CZK, EUR, USD)
        - date: string (YYYY-MM-DD format)
        - supplierName: string
        - supplierIco: string (Czech identification number/IČO if available, otherwise empty string)
        - vatRate: number (main VAT rate in percentage, e.g., 21, 12, or 0)
        - variableSymbol: string (if available)
        
        If a field cannot be found, use null for numbers and empty string for strings.
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response if it contains markdown code blocks
      const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", text);
        throw new Error("Invalid response format from AI");
      }

      return {
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: data.currency || "CZK",
        date: data.date ? new Date(data.date) : new Date(),
        supplierName: data.supplierName || "",
        ico: data.supplierIco || "",
        vatRate: typeof data.vatRate === 'number' ? data.vatRate : 21,
        variableSymbol: data.variableSymbol || "",
        confidence: 0.9,
        rawText: text
      };
    } catch (error) {
      console.error("Gemini OCR Error:", error);
      throw new Error("Failed to process receipt with Gemini AI");
    }
  }

  async suggestCategory(supplierName: string, description: string): Promise<string | null> {
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Suggest a single category name for an expense based on the supplier and description.
        Supplier: ${supplierName}
        Description: ${description}
        
        Return ONLY the category name as a plain string. Examples: Office Supplies, Travel, Software, Services, Refreshments.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini Category Suggestion Error:", error);
      return null;
    }
  }

  async analyzeInvoiceText(text: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        Analyze and improve the following invoice description to be more professional and clear.
        Input text: "${text}"
        
        Return ONLY the improved text as a plain string.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Gemini Text Analysis Error:", error);
      return text;
    }
  }
}
