
import { OCRProvider, OCRResult } from "./types";

export class MockOCRProvider implements OCRProvider {
  async processReceipt(file: File): Promise<OCRResult> {
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

    return {
      amount: randomAmount,
      currency: "CZK",
      date: new Date(),
      supplierName: randomSupplier.name,
      ico: randomSupplier.ico,
      confidence: 0.85 + (Math.random() * 0.14), // 0.85 - 0.99
      rawText: "Mocked OCR Text Result"
    };
  }
}
