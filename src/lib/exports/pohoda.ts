import { Invoice, InvoiceItem, Organization, Client, BankDetail } from "@prisma/client";

type InvoiceWithDetails = Invoice & {
  organization: Organization;
  client: Client;
  items: InvoiceItem[];
  bankDetail?: BankDetail | null;
};

// Helper to escape XML characters
const escape = (str: string | null | undefined) => {
  if (!str) return "";
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
};

function generatePohodaItem(invoice: InvoiceWithDetails): string {
  return `
  <dat:dataPackItem id="${escape(invoice.number)}" version="2.0">
    <inv:invoice version="2.0">
      <inv:invoiceHeader>
        <inv:invoiceType>issuedInvoice</inv:invoiceType>
        <inv:number>
          <typ:numberRequested>${escape(invoice.number)}</typ:numberRequested>
        </inv:number>
        <inv:symVar>${escape(invoice.variableSymbol || invoice.number)}</inv:symVar>
        <inv:date>${invoice.issuedAt.toISOString().split('T')[0]}</inv:date>
        <inv:dateTax>${invoice.issuedAt.toISOString().split('T')[0]}</inv:dateTax>
        <inv:dateDue>${invoice.dueAt.toISOString().split('T')[0]}</inv:dateDue>
        <inv:text>Faktura ${escape(invoice.number)}</inv:text>
        <inv:partnerIdentity>
          <typ:address>
            <typ:company>${escape(invoice.client.name)}</typ:company>
            <typ:name>${escape(invoice.client.name)}</typ:name>
            <typ:street>${escape(invoice.client.address || '')}</typ:street>
            <typ:ico>${escape(invoice.client.taxId || '')}</typ:ico>
            <typ:dic>${escape(invoice.client.vatId || '')}</typ:dic>
          </typ:address>
        </inv:partnerIdentity>
        <inv:paymentType>
          <typ:paymentType>draft</typ:paymentType>
        </inv:paymentType>
        <inv:account>
          <typ:accountNo>${escape(invoice.bankDetail?.accountNumber || '')}</typ:accountNo>
          <typ:bankCode>${escape(invoice.bankDetail?.bankName || '')}</typ:bankCode>
        </inv:account>
      </inv:invoiceHeader>
      
      <inv:invoiceDetail>
        ${invoice.items.map(item => {
          const net = item.totalAmount;
          const tax = net * (item.vatRate / 100);
          const gross = net + tax;
          // Pohoda uses 'high' for standard rate, 'low' for reduced, 'none' for 0.
          let rateVAT = "none";
          if (item.vatRate > 15) rateVAT = "high";
          else if (item.vatRate > 0) rateVAT = "low";

          return `
        <inv:invoiceItem>
          <inv:text>${escape(item.description)}</inv:text>
          <inv:quantity>${item.quantity}</inv:quantity>
          <inv:unit>ks</inv:unit>
          <inv:rateVAT>${rateVAT}</inv:rateVAT>
          <inv:homeCurrency>
            <typ:unitPrice>${item.unitPrice.toFixed(2)}</typ:unitPrice>
            <typ:price>${net.toFixed(2)}</typ:price>
            <typ:priceVAT>${tax.toFixed(2)}</typ:priceVAT>
            <typ:priceSum>${gross.toFixed(2)}</typ:priceSum>
          </inv:homeCurrency>
        </inv:invoiceItem>
        `;
        }).join('')}
      </inv:invoiceDetail>
      
      <inv:invoiceSummary>
        <inv:roundingDocument>math2one</inv:roundingDocument>
      </inv:invoiceSummary>
    </inv:invoice>
  </dat:dataPackItem>`;
}

export function generatePohodaBatch(invoices: InvoiceWithDetails[]): string {
  if (invoices.length === 0) return "";
  
  const org = invoices[0].organization; // Assume all invoices are from same org

  return `<?xml version="1.0" encoding="UTF-8"?>
<dat:dataPack xmlns:dat="http://www.stormware.cz/schema/version_2/data.xsd" 
              xmlns:inv="http://www.stormware.cz/schema/version_2/invoice.xsd" 
              xmlns:typ="http://www.stormware.cz/schema/version_2/type.xsd" 
              id="${new Date().getTime()}" 
              ico="${escape(org.taxId || '')}" 
              application="Vulpi" 
              version="2.0" 
              note="Import faktur z Vulpi">
  ${invoices.map(generatePohodaItem).join('')}
</dat:dataPack>`;
}

export function generatePohoda(invoice: InvoiceWithDetails): string {
  return generatePohodaBatch([invoice]);
}
