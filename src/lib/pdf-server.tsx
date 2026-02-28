import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';
import { Invoice, Organization, Client, InvoiceItem, BankDetail } from '@prisma/client';

interface InvoicePDFProps {
  invoice: Invoice & { items: InvoiceItem[] };
  organization: Organization;
  client: Client;
  bankDetail?: BankDetail | null;
  qrCodeUrl?: string;
}

export async function generateInvoicePdfBuffer(props: InvoicePDFProps): Promise<Buffer> {
  return await renderToBuffer(<InvoicePDF {...props} />);
}
