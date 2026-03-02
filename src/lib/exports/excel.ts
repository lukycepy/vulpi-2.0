import * as XLSX from "xlsx";
import { Invoice, Client } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/format";

export function generateExcel(invoices: (Invoice & { client: Client })[]) {
  const data = invoices.map(invoice => ({
    "Číslo faktury": invoice.number,
    "Klient": invoice.client.name,
    "IČO": invoice.client.taxId || "",
    "Vystaveno": formatDate(invoice.issuedAt),
    "Splatnost": formatDate(invoice.dueAt),
    "Celkem bez DPH": invoice.totalAmount - invoice.totalVat,
    "DPH": invoice.totalVat,
    "Celkem s DPH": invoice.totalAmount,
    "Měna": invoice.currency,
    "Stav": invoice.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Faktury");

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
  
  return excelBuffer;
}
