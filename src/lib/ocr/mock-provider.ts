
import { OCRProvider, OCRResult } from "./types";

export class MockOCRProvider implements OCRProvider {
  async processReceipt(file: File | Blob): Promise<OCRResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockSuppliers = [
      { name: "Alza.cz a.s.", ico: "27082440" },
      { name: "Rohlik.cz Finance a.s.", ico: "06984852" },
      { name: "Shell Czech Republic a.s.", ico: "25074219" },
      { name: "Lidl Česká republika v.o.s.", ico: "26178541" },
      { name: "O2 Czech Republic a.s.", ico: "60193336" }
    ];

    const randomSupplier = mockSuppliers[Math.floor(Math.random() * mockSuppliers.length)];
    const randomAmount = Math.floor(Math.random() * 5000) + 100;
    const vatRate = 21;
    const vatAmount = randomAmount * (vatRate / 100);

    return {
      amount: randomAmount,
      currency: "CZK",
      date: new Date(),
      supplierName: randomSupplier.name,
      ico: randomSupplier.ico,
      confidence: 0.85 + (Math.random() * 0.14), // 0.85 - 0.99
      rawText: "Mocked OCR Text Result",
      items: [
        { description: "Položka 1", amount: randomAmount * 0.6 },
        { description: "Položka 2", amount: randomAmount * 0.4 }
      ],
      vatRate: 21,
      variableSymbol: `2024${Math.floor(Math.random() * 1000)}`
    };
  }

  async suggestCategory(supplierName: string, description: string): Promise<string | null> {
    // Mock implementation using simple keyword matching
    const lower = (supplierName + " " + description).toLowerCase();

    if (lower.includes("alza") || lower.includes("czc") || lower.includes("apple") || lower.includes("dell") || lower.includes("datart")) {
      return "HARDWARE"; // Placeholder ID, real app would look up DB
    }
    if (lower.includes("aws") || lower.includes("azure") || lower.includes("digitalocean") || lower.includes("heroku")) {
      return "HOSTING"; // or SOFTWARE
    }
    if (lower.includes("google") || lower.includes("meta") || lower.includes("facebook") || lower.includes("reklama")) {
      return "MARKETING";
    }
    if (lower.includes("shell") || lower.includes("omv") || lower.includes("mol") || lower.includes("benzina")) {
      return "FUEL";
    }
    if (lower.includes("rohlik") || lower.includes("kosik") || lower.includes("lidl") || lower.includes("kaufland") || lower.includes("potraviny") || lower.includes("restaurace")) {
      return "REFRESHMENT"; // or OFFICE_SUPPLIES depending on context
    }
    if (lower.includes("o2") || lower.includes("t-mobile") || lower.includes("vodafone")) {
      return "PHONE_INTERNET";
    }

    return null;
  }

  async analyzeInvoiceText(text: string): Promise<string> {
    // Mock AI text improvement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerText = text.toLowerCase();

    if (lowerText.includes("web") || lowerText.includes("stránky")) {
        return "Návrh a kódování responzivní webové prezentace (rozsah 3 MD). Zahrnuje UX/UI design, implementaci v React/Next.js a základní SEO optimalizaci.";
    }
    
    if (lowerText.includes("konzultace") || lowerText.includes("poradenství")) {
        return "Odborné konzultace v oblasti vývoje software a architektury (rozsah 2 hodiny).";
    }

    if (lowerText.includes("logo") || lowerText.includes("grafika")) {
        return "Grafické práce: návrh logotypu a firemní identity, příprava tiskových dat.";
    }

    if (lowerText.includes("audit") || lowerText.includes("seo")) {
        return "SEO audit a analýza klíčových slov pro optimalizaci webových stránek.";
    }

    if (lowerText.includes("aplikace") || lowerText.includes("app")) {
        return "Vývoj mobilní/webové aplikace: frontend, backend a API integrace.";
    }

    return `Profesionální služby: ${text} (kompletní realizace dle specifikace).`;
  }
}
