import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';
import { Invoice, Organization, Client, InvoiceItem, BankDetail, InvoiceTemplate } from '@prisma/client';
import { generateBarcodeDataUrl } from './barcode';

interface InvoicePDFProps {
  invoice: Invoice & { items: InvoiceItem[]; template: InvoiceTemplate | null };
  organization: Organization;
  client: Client;
  bankDetail?: BankDetail | null;
  qrCodeUrl?: string;
}

export async function generateInvoicePdfBuffer(props: InvoicePDFProps): Promise<Buffer> {
  const barcodes: Record<string, string> = {};
  
  if (props.invoice.template?.showBarcodes) {
    for (const item of props.invoice.items) {
      if (item.sku) {
        try {
          barcodes[item.id] = await generateBarcodeDataUrl(item.sku);
        } catch (e) {
          console.error(`Failed to generate barcode for SKU ${item.sku}`, e);
        }
      }
    }
  }

  const invoiceWithDetails = {
    ...props.invoice,
    organization: props.organization,
    client: props.client,
    bankDetail: props.bankDetail || null,
    template: props.invoice.template || null,
  };
  
  return await renderToBuffer(<InvoicePDF invoice={invoiceWithDetails} qrCodeUrl={props.qrCodeUrl} barcodes={barcodes} />);
}
