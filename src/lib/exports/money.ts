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

function generateMoneyS3Item(invoice: InvoiceWithDetails): string {
  return `
    <FaktVyd>
      <Doklad>${escape(invoice.number)}</Doklad>
      <Popis>Faktura ${escape(invoice.number)}</Popis>
      <Vystaveno>${invoice.issuedAt.toISOString().split('T')[0]}</Vystaveno>
      <DatUcPr>${invoice.issuedAt.toISOString().split('T')[0]}</DatUcPr>
      <PlnenoDPH>${invoice.issuedAt.toISOString().split('T')[0]}</PlnenoDPH>
      <Splatno>${invoice.dueAt.toISOString().split('T')[0]}</Splatno>
      <VarSymbol>${escape(invoice.variableSymbol || invoice.number)}</VarSymbol>
      <Celkem>${(invoice.totalAmount + invoice.totalVat).toFixed(2)}</Celkem>
      <DodOdb>
        <ObchNaz>${escape(invoice.client.name)}</ObchNaz>
        <FaktNaz>${escape(invoice.client.name)}</FaktNaz>
        <Ulice>${escape(invoice.client.address || '')}</Ulice>
        <ICO>${escape(invoice.client.taxId || '')}</ICO>
        <DIC>${escape(invoice.client.vatId || '')}</DIC>
      </DodOdb>
      <Polozky>
        ${invoice.items.map(item => {
          const net = item.totalAmount;
          return `
        <Polozka>
          <Popis>${escape(item.description)}</Popis>
          <PocetMJ>${item.quantity}</PocetMJ>
          <Cena>${item.unitPrice.toFixed(2)}</Cena>
          <SazbaDPH>${item.vatRate}</SazbaDPH>
          <Celkem>${net.toFixed(2)}</Celkem>
        </Polozka>
        `;
        }).join('')}
      </Polozky>
    </FaktVyd>`;
}

export function generateMoneyS3Batch(invoices: InvoiceWithDetails[]): string {
  if (invoices.length === 0) return "";
  
  const org = invoices[0].organization;

  return `<?xml version="1.0" encoding="UTF-8"?>
<MoneyData Ico="${escape(org.taxId || '')}" KodAgendy="FAKTURY" HospRokFrom="${new Date().getFullYear()}-01-01" HospRokTo="${new Date().getFullYear()}-12-31" Description="Export z Vulpi">
  <SeznamFaktVyd>
    ${invoices.map(generateMoneyS3Item).join('')}
  </SeznamFaktVyd>
</MoneyData>`;
}

export function generateMoneyS3(invoice: InvoiceWithDetails): string {
  return generateMoneyS3Batch([invoice]);
}
