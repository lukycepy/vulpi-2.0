
export interface OCRResult {
  amount: number;
  currency: string;
  date: Date;
  supplierName: string;
  ico: string;
  confidence: number;
  rawText?: string;
}

export interface OCRProvider {
  processReceipt(file: File): Promise<OCRResult>;
}
