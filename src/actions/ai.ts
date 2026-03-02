
"use server";

import { getOcrProvider } from "@/lib/ocr/factory";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

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

export async function analyzeSentiment(text: string): Promise<{ sentiment: "ANGRY" | "NEUTRAL" | "HAPPY", score: number, priority: "LOW" | "MEDIUM" | "HIGH" }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Missing GEMINI_API_KEY");
      return { sentiment: "NEUTRAL", score: 0.5, priority: "LOW" };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyzuj následující zprávu od klienta. 
      Vrať pouze čistý JSON s vlastnostmi: 
      - 'sentiment' (kladný, neutrální, záporný)
      - 'score' (číslo 1-10)
      - 'priority' (LOW, MEDIUM, HIGH). Naštvané zprávy mají HIGH.
      
      Zpráva: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonString);

    let sentiment: "ANGRY" | "NEUTRAL" | "HAPPY" = "NEUTRAL";
    if (data.sentiment === "záporný") sentiment = "ANGRY";
    if (data.sentiment === "kladný") sentiment = "HAPPY";

    return {
      sentiment,
      score: data.score || 5,
      priority: data.priority || "LOW"
    };

  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return { sentiment: "NEUTRAL", score: 0.5, priority: "LOW" };
  }
}

export async function generateItemDescription(itemName: string): Promise<string> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return itemName;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Jsi profesionální copywriter. Uživatel zadá krátký název položky na faktuře.
            Vygeneruj k tomu profesionální, 2-3 větý popis práce, který bude působit hodnotně pro klienta.
            Vrať pouze samotný text.
            
            Položka: "${itemName}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Description Generation Error:", error);
        return itemName;
    }
}

export async function predictFutureRevenue(organizationId: string): Promise<{ predictedAmount: number, reasoning: string } | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return null;

        // Fetch paid invoices for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const invoices = await prisma.invoice.findMany({
            where: {
                organizationId,
                status: "PAID",
                updatedAt: { gte: sixMonthsAgo }
            },
            select: {
                totalAmount: true,
                updatedAt: true
            }
        });

        if (invoices.length === 0) return null;

        // Aggregate by month
        const monthlyRevenue: Record<string, number> = {};
        invoices.forEach(inv => {
            const month = inv.updatedAt.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.totalAmount;
        });

        const summary = Object.entries(monthlyRevenue)
            .map(([month, amount]) => `${month}: ${amount.toFixed(0)} CZK`)
            .join("\n");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Zde jsou obraty firmy za posledních 6 měsíců:
            ${summary}
            
            Analyzuj trend a odhadni obrat na další měsíc.
            Vrať POUZE čistý JSON s vlastnostmi: 
            - 'predictedAmount' (číslo, odhadovaná částka)
            - 'reasoning' (krátké textové zdůvodnění v češtině, max 2 věty).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Revenue Prediction Error:", error);
        return null;
    }
}
