
import QRCode from "qrcode";

interface PaymentData {
  iban: string;
  amount: number;
  currency: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  message?: string;
  date?: Date;
}

export function generateSPDCString(data: PaymentData): string {
  const parts = ["SPD", "1.0"];

  if (data.iban) parts.push(`ACC:${data.iban}`);
  if (data.amount) parts.push(`AM:${data.amount.toFixed(2)}`);
  if (data.currency) parts.push(`CC:${data.currency}`);
  if (data.variableSymbol) parts.push(`X-VS:${data.variableSymbol}`);
  if (data.constantSymbol) parts.push(`X-KS:${data.constantSymbol}`);
  if (data.specificSymbol) parts.push(`X-SS:${data.specificSymbol}`);
  if (data.message) parts.push(`MSG:${data.message.substring(0, 60)}`); // Max 60 chars
  if (data.date) {
    const d = data.date;
    const dateStr = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    parts.push(`DT:${dateStr}`);
  }

  return parts.join("*");
}

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error("Error generating QR code", err);
    return "";
  }
}
