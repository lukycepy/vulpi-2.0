
"use server";

import { getOcrProvider } from "@/lib/ocr/factory";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function askFoxAssistant(message: string, history: {role: 'user' | 'bot', text: string}[] = [], context?: any): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "Promiň, ale nemám nastavený klíč k mému mozku (GEMINI_API_KEY).";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use 'gemini-2.5-flash' which is available for this key
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `
      Jsi přátelská liška Vulpi, účetní asistent v SaaS aplikaci.
      Odpovídej stručně, hravě a pomáhej uživatelům s fakturací a daněmi.
      Používej emoji 🦊.
      
      Kontext uživatele (pokud existuje): ${JSON.stringify(context || {})}
    `
    });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Fox AI Error:", error);
    
    // Log detailed error information
    if (error.response) {
       console.error("Gemini API Error Response:", await error.response.text());
    }
    
    return `Omlouvám se, něco se pokazilo v mém liščím doupěti. Chyba: ${error.message || "Neznámá chyba"}. Zkuste to prosím později. 🦊❌`;
  }
}

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
