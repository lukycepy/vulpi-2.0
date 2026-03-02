
export interface OCRResult {
  amount: number;
  currency: string;
  date: Date;
  supplierName: string;
  ico: string;
  confidence: number;
  rawText?: string;
  items?: { description: string; amount: number }[];
  vatRate?: number;
  variableSymbol?: string;
}

export interface OCRProvider {
  processReceipt(file: File | Blob): Promise<OCRResult>;
  suggestCategory(supplierName: string, description: string): Promise<string | null>;
  analyzeInvoiceText(text: string): Promise<string>;
}
